import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import type {
  ModelRouterConfig,
  ModelCatalogAuditEvent,
  ModelCatalogChange,
  ModelCatalogStatus,
  Provider,
  RoutedModelConfig
} from '../types.js';

import { ContextBridge } from '../context-bridge/index.js';

const execFileAsync = promisify(execFile);

const DEFAULT_TTL_HOURS = 48;
const DEFAULT_ORACLE_TIMEOUT_SECONDS = 120;

const VALID_PROVIDERS: Provider[] = ['anthropic', 'openai', 'openrouter', 'gemini'];

export interface ModelFreshnessOptions {
  sessionId?: string;
  ttlHours?: number;
  criticalKeys: string[];
}

export interface OracleRefreshOutcome {
  status: ModelCatalogStatus;
  updated: boolean;
}

interface OracleCatalogResponse {
  providerPreference?: Provider[];
  models: RoutedModelConfig[];
  notes?: string;
}

function extractFirstJson(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (start === -1) {
      if (char === '{') {
        start = i;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function coerceString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isProvider(value: unknown): value is Provider {
  return typeof value === 'string' && VALID_PROVIDERS.includes(value as Provider);
}

function isQualityTier(value: unknown): value is RoutedModelConfig['quality'] {
  return value === 'fast' || value === 'balanced' || value === 'quality';
}

function isValidModelEntry(entry: unknown): entry is RoutedModelConfig {
  if (!entry || typeof entry !== 'object') {
    return false;
  }
  const record = entry as Record<string, unknown>;
  return (
    typeof record.key === 'string'
    && isProvider(record.provider)
    && typeof record.model === 'string'
    && isQualityTier(record.quality)
    && typeof record.costPerMTokIn === 'number'
    && typeof record.costPerMTokOut === 'number'
  );
}

function parseOracleResponse(text: string): OracleCatalogResponse | null {
  const jsonText = extractFirstJson(text);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const models = Array.isArray(parsed.models)
      ? parsed.models.filter(isValidModelEntry)
      : [];
    if (models.length === 0) {
      return null;
    }

    const providerPreference = Array.isArray(parsed.providerPreference)
      ? parsed.providerPreference.filter(isProvider)
      : undefined;

    return {
      providerPreference,
      models,
      notes: coerceString(parsed.notes)
    };
  } catch {
    return null;
  }
}

function mergeCatalog(
  current: ModelRouterConfig,
  candidate: OracleCatalogResponse
): { merged: ModelRouterConfig; changes: ModelCatalogChange[] } {
  const existingByKey = new Map(current.models.map(model => [model.key, model]));
  const candidateByKey = new Map(candidate.models.map(model => [model.key, model]));

  const mergedModels: RoutedModelConfig[] = [];
  const changes: ModelCatalogChange[] = [];

  for (const existing of current.models) {
    const replacement = candidateByKey.get(existing.key) ?? existing;
    mergedModels.push(replacement);
    if (replacement !== existing) {
      const changed = JSON.stringify(existing) !== JSON.stringify(replacement);
      if (changed) {
        changes.push({
          modelKey: existing.key,
          provider: replacement.provider,
          before: existing,
          after: replacement
        });
      }
    }
  }

  for (const [key, model] of candidateByKey.entries()) {
    if (!existingByKey.has(key)) {
      mergedModels.push(model);
      changes.push({
        modelKey: key,
        provider: model.provider,
        before: model,
        after: model,
        reason: 'new model key from oracle refresh'
      });
    }
  }

  return {
    merged: {
      providerPreference: candidate.providerPreference ?? current.providerPreference,
      models: mergedModels
    },
    changes
  };
}

function criticalKeysOk(config: ModelRouterConfig, keys: string[]): boolean {
  const available = new Set(config.models.map(model => model.key));
  return keys.every(key => available.has(key));
}

function buildPrompt(criticalKeys: string[]): string {
  return [
    'You are updating the Janus model catalog.',
    'Return JSON only. Do not include markdown or commentary.',
    '',
    'Task:',
    '- Use the attached models.json as the base.',
    '- Update ONLY the model ids and pricing so that the critical keys map to current frontier models.',
    '- Keep existing keys unless a key must be added to represent a frontier replacement.',
    '- Use OpenRouter pricing if known; otherwise keep the current pricing.',
    '',
    `Critical keys: ${criticalKeys.join(', ')}`,
    '',
    'Required JSON schema:',
    '{',
    '  "providerPreference": ["anthropic","openai","gemini","openrouter"],',
    '  "models": [',
    '    {',
    '      "key": "...",',
    '      "provider": "anthropic|openai|gemini|openrouter",',
    '      "model": "...",',
    '      "quality": "fast|balanced|quality",',
    '      "costPerMTokIn": 0.0,',
    '      "costPerMTokOut": 0.0',
    '    }',
    '  ],',
    '  "notes": "<short rationale>"',
    '}'
  ].join('\n');
}

async function runOracleRefresh(
  modelsPath: string,
  criticalKeys: string[]
): Promise<OracleCatalogResponse | null> {
  const prompt = buildPrompt(criticalKeys);
  const outputPath = path.join(os.tmpdir(), `janus-oracle-models-${Date.now()}.json`);
  const timeoutSeconds = Number(process.env.JANUS_ORACLE_TIMEOUT_SECONDS || DEFAULT_ORACLE_TIMEOUT_SECONDS);
  const oracleModel = process.env.JANUS_ORACLE_MODEL;
  const slug = `janus-model-refresh-${Date.now()}`;

  const args = [
    '--wait',
    '--slug',
    slug,
    '--prompt',
    prompt,
    '--file',
    modelsPath,
    '--write-output',
    outputPath,
    '--timeout',
    `${timeoutSeconds}`
  ];

  if (oracleModel) {
    args.push('--model', oracleModel);
  }

  await execFileAsync('oracle', args, { cwd: process.cwd() });

  const raw = await fs.readFile(outputPath, 'utf-8');
  await fs.unlink(outputPath).catch(() => undefined);

  return parseOracleResponse(raw);
}

export async function ensureModelFreshness(
  options: ModelFreshnessOptions
): Promise<OracleRefreshOutcome> {
  const bridge = new ContextBridge();
  const ttlHours = options.ttlHours ?? DEFAULT_TTL_HOURS;
  const now = new Date();
  const nowIso = now.toISOString();

  const status = await bridge.getModelCatalogStatus();
  const lastVerifiedAt = status?.lastVerifiedAt ? Date.parse(status.lastVerifiedAt) : 0;
  const ttlMs = ttlHours * 60 * 60 * 1000;
  const isFresh = Boolean(status?.lastVerifiedAt)
    && Number.isFinite(lastVerifiedAt)
    && now.getTime() - lastVerifiedAt <= ttlMs
    && status?.criticalOk;

  if (isFresh) {
    return { status, updated: false };
  }

  const currentConfig = await bridge.getModelRouterConfig();
  if (!currentConfig) {
    const unknownStatus: ModelCatalogStatus = {
      version: 1,
      lastVerifiedAt: undefined,
      ttlHours,
      status: 'unknown',
      source: 'oracle',
      criticalKeys: options.criticalKeys,
      criticalOk: false,
      notes: 'models.json missing'
    };
    await bridge.saveModelCatalogStatus(unknownStatus);
    return { status: unknownStatus, updated: false };
  }

  let oracleResponse: OracleCatalogResponse | null = null;
  let refreshError = '';

  try {
    const contextRoot = process.env.JANUS_CONTEXT_PATH || './janus-context';
    const modelsPath = path.resolve(process.cwd(), contextRoot, 'state', 'models.json');
    oracleResponse = await runOracleRefresh(
      modelsPath,
      options.criticalKeys
    );
  } catch (error) {
    refreshError = String(error);
  }

  const auditBase: Omit<ModelCatalogAuditEvent, 'changes' | 'status'> = {
    id: uuidv4(),
    timestamp: nowIso,
    sessionId: options.sessionId,
    source: 'oracle',
    ttlHours,
    criticalKeys: options.criticalKeys
  };

  if (!oracleResponse) {
    const staleStatus: ModelCatalogStatus = {
      version: 1,
      lastVerifiedAt: status?.lastVerifiedAt,
      ttlHours,
      status: 'stale',
      source: 'oracle',
      criticalKeys: options.criticalKeys,
      criticalOk: false,
      notes: refreshError || 'oracle refresh failed'
    };

    await bridge.saveModelCatalogStatus(staleStatus);
    await bridge.appendModelCatalogAudit({
      ...auditBase,
      status: 'failed',
      changes: [],
      error: refreshError || 'oracle refresh failed'
    });

    return { status: staleStatus, updated: false };
  }

  const { merged, changes } = mergeCatalog(currentConfig, oracleResponse);
  const ok = criticalKeysOk(merged, options.criticalKeys);
  const statusValue: ModelCatalogStatus = {
    version: 1,
    lastVerifiedAt: nowIso,
    ttlHours,
    status: ok ? 'fresh' : 'stale',
    source: 'oracle',
    criticalKeys: options.criticalKeys,
    criticalOk: ok,
    notes: oracleResponse.notes
  };

  await bridge.saveModelRouterConfig(merged);
  await bridge.saveModelCatalogStatus(statusValue);

  const auditStatus: ModelCatalogAuditEvent = {
    ...auditBase,
    status: changes.length > 0 ? 'updated' : 'skipped',
    changes,
    notes: oracleResponse.notes
  };
  await bridge.appendModelCatalogAudit(auditStatus);

  return { status: statusValue, updated: changes.length > 0 };
}
