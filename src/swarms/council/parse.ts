import type { AdvisorId, Alternative, Delegation, Disagreement } from '../../types.js';

export interface ParsedProposal {
  response: string;
  confidence: number;
  uncertainties: string[];
  assumptions: string[];
  alternatives: Alternative[];
  delegations: Delegation[];
  reasoning: string;
}

export interface ParsedSynthesis {
  consensus: string | null;
  disagreements: Disagreement[];
  synthesizedAnswer: string;
}

const VALID_ADVISORS = new Set<AdvisorId>(['claude', 'gpt', 'gemini']);
const VALID_SEVERITIES = new Set(['minor', 'moderate', 'significant']);

function extractFirstJsonObject(text: string): string | null {
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

function parseJson(text: string): Record<string, unknown> | null {
  const jsonText = extractFirstJsonObject(text);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function coerceString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function normalizeConfidence(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).map(item => item.trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function normalizeAlternatives(value: unknown): Alternative[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const alternatives: Alternative[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const description = coerceString(record.description, '');
    if (!description) {
      continue;
    }
    const rejectionReason = coerceString(record.rejectionReason ?? record.reason, '');
    alternatives.push({
      description,
      rejectionReason
    });
  }

  return alternatives;
}

function normalizeDelegations(value: unknown): Delegation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const delegations: Delegation[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const task = coerceString(record.task, '');
    const target = coerceString(record.targetSwarm, '');

    if (!task || (target !== 'scout-swarm' && target !== 'executor-swarm')) {
      continue;
    }

    delegations.push({
      task,
      targetSwarm: target as Delegation['targetSwarm'],
      rationale: coerceString(record.rationale, '')
    });
  }

  return delegations;
}

function normalizeAdvisorId(value: unknown): AdvisorId | null {
  if (typeof value !== 'string') {
    return null;
  }
  if (VALID_ADVISORS.has(value as AdvisorId)) {
    return value as AdvisorId;
  }
  return null;
}

function normalizeSeverity(value: unknown): Disagreement['severity'] {
  if (typeof value === 'string') {
    if (VALID_SEVERITIES.has(value)) {
      return value as Disagreement['severity'];
    }
    const lowered = value.toLowerCase();
    if (lowered === 'high' || lowered === 'major' || lowered === 'critical') {
      return 'significant';
    }
    if (lowered === 'low' || lowered === 'minor') {
      return 'minor';
    }
  }
  return 'moderate';
}

function normalizePositions(value: unknown): Disagreement['positions'] {
  if (!Array.isArray(value)) {
    return [];
  }

  const positions: Disagreement['positions'] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const advisor = normalizeAdvisorId(record.advisor);
    const position = coerceString(record.position ?? record.view, '');
    if (!advisor || !position) {
      continue;
    }
    positions.push({
      advisor,
      position,
      confidence: normalizeConfidence(record.confidence, 50)
    });
  }

  return positions;
}

function normalizeDisagreements(value: unknown): Disagreement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const disagreements: Disagreement[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const topic = coerceString(record.topic ?? record.issue, '');
    const positions = normalizePositions(record.positions);
    if (!topic || positions.length === 0) {
      continue;
    }
    const resolution = coerceString(record.resolution, '');
    disagreements.push({
      topic,
      positions,
      severity: normalizeSeverity(record.severity),
      resolution: resolution || undefined
    });
  }

  return disagreements;
}

export function parseProposal(text: string, advisorId: AdvisorId): ParsedProposal {
  const trimmed = text.trim();
  const parsed = parseJson(text);

  if (!parsed) {
    return {
      response: trimmed || `No response from ${advisorId}.`,
      confidence: 50,
      uncertainties: [],
      assumptions: [],
      alternatives: [],
      delegations: [],
      reasoning: ''
    };
  }

  const response = coerceString(
    parsed.response ?? parsed.proposal ?? parsed.answer,
    trimmed || `No response from ${advisorId}.`
  );
  const reasoning = coerceString(parsed.reasoning ?? parsed.rationale, '');

  return {
    response,
    confidence: normalizeConfidence(parsed.confidence, 50),
    uncertainties: toStringArray(parsed.uncertainties),
    assumptions: toStringArray(parsed.assumptions),
    alternatives: normalizeAlternatives(parsed.alternatives),
    delegations: normalizeDelegations(parsed.delegations),
    reasoning
  };
}

export function parseSynthesis(text: string): ParsedSynthesis {
  const trimmed = text.trim();
  const parsed = parseJson(text);

  if (!parsed) {
    return {
      consensus: null,
      disagreements: [],
      synthesizedAnswer: trimmed || ''
    };
  }

  const consensusText = coerceString(parsed.consensus ?? parsed.summary, '');
  const consensus = consensusText ? consensusText : null;
  const synthesizedAnswer = coerceString(
    parsed.synthesizedAnswer ?? parsed.answer ?? parsed.recommendation,
    trimmed
  );

  return {
    consensus,
    disagreements: normalizeDisagreements(parsed.disagreements ?? parsed.conflicts),
    synthesizedAnswer
  };
}
