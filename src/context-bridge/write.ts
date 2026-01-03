/**
 * Context Bridge - Write Operations
 *
 * Persists state to janus-context/ directory
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session, Decision, Task, CurrentFocus } from '../types.js';

const getContextPath = () => process.env.JANUS_CONTEXT_PATH || './janus-context';

export async function createSession(summary: string): Promise<Session> {
  const session: Session = {
    id: uuidv4(),
    started: new Date().toISOString(),
    summary,
    keyDecisions: [],
    openQuestions: [],
    delegatedTasks: [],
    modelsInvolved: []
  };

  await saveSession(session);
  return session;
}

export async function saveSession(session: Session): Promise<void> {
  const sessionPath = path.join(getContextPath(), 'sessions', `${session.id}.json`);
  await ensureDir(path.dirname(sessionPath));
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
}

export async function recordDecision(
  sessionId: string,
  decision: Decision
): Promise<void> {
  // Save as markdown in decisions/
  // Sanitize topic for filesystem safety (Windows and Unix)
  const safeTopic = decision.topic
    .replace(/[<>:"/\\|?*]+/g, '')  // Remove invalid chars
    .replace(/\s+/g, '-')           // Spaces to dashes
    .toLowerCase();
  const filename = `${decision.date}-${safeTopic}.md`;
  const decisionPath = path.join(getContextPath(), 'decisions', filename);

  const markdown = formatDecisionMarkdown(decision);
  await ensureDir(path.dirname(decisionPath));
  await fs.writeFile(decisionPath, markdown, 'utf-8');

  // Also add to session
  const session = await loadSessionSafe(sessionId);
  if (session) {
    session.keyDecisions.push(decision);
    await saveSession(session);
  }
}

export async function delegateTask(task: Task): Promise<void> {
  const taskPath = path.join(
    getContextPath(),
    'state',
    'delegations',
    `${task.id}.json`
  );
  await ensureDir(path.dirname(taskPath));
  await fs.writeFile(taskPath, JSON.stringify(task, null, 2), 'utf-8');
  await upsertTaskIntoSession(task);
}

export async function updateTask(
  taskId: string,
  patch: Partial<Task>
): Promise<void> {
  const taskPath = path.join(
    getContextPath(),
    'state',
    'delegations',
    `${taskId}.json`
  );

  try {
    const content = await fs.readFile(taskPath, 'utf-8');
    const task: Task = JSON.parse(content);
    const sanitizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined)
    ) as Partial<Task>;
    const updated: Task = { ...task, ...sanitizedPatch };

    await fs.writeFile(taskPath, JSON.stringify(updated, null, 2), 'utf-8');
    await upsertTaskIntoSession(updated);
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error);
    throw error;
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: Task['status'],
  result?: string
): Promise<void> {
  const patch: Partial<Task> = { status };
  if (result) patch.result = result;
  await updateTask(taskId, patch);
}

export async function updateFocus(
  focus: Partial<CurrentFocus>
): Promise<void> {
  const focusPath = path.join(getContextPath(), 'state', 'current-focus.json');

  try {
    const content = await fs.readFile(focusPath, 'utf-8');
    const current: CurrentFocus = JSON.parse(content);
    const updated: CurrentFocus = {
      ...current,
      ...focus,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(focusPath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to update focus:', error);
    throw error;
  }
}

function formatDecisionMarkdown(decision: Decision): string {
  return `# ${decision.topic}

**Date:** ${decision.date}
**Timestamp:** ${decision.timestamp}
**Made By:** ${decision.madeBy}
**Confidence:** ${decision.confidence}%
**Reversible:** ${decision.reversible}

## Decision

${decision.decision}

## Rationale

${decision.rationale}

## Alternatives Considered

${decision.alternatives.map((alt: string) => `- ${alt}`).join('\n')}
`;
}

async function loadSessionSafe(id: string): Promise<Session | null> {
  try {
    const sessionPath = path.join(getContextPath(), 'sessions', `${id}.json`);
    const content = await fs.readFile(sessionPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getSessionIdFromContext(context: string): string | null {
  const prefix = 'session=';
  for (const part of context.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      const sessionId = trimmed.slice(prefix.length).trim();
      return sessionId || null;
    }
  }
  return null;
}

async function upsertTaskIntoSession(task: Task): Promise<void> {
  try {
    const sessionId = getSessionIdFromContext(task.context);
    if (!sessionId) {
      return;
    }

    const session = await loadSessionSafe(sessionId);
    if (!session) {
      return;
    }

    const existingIndex = session.delegatedTasks.findIndex(item => item.id === task.id);
    if (existingIndex >= 0) {
      session.delegatedTasks[existingIndex] = task;
    } else {
      session.delegatedTasks.push(task);
    }

    if (task.model && !session.modelsInvolved.includes(task.model)) {
      session.modelsInvolved.push(task.model);
    }

    await saveSession(session);
  } catch (error) {
    console.warn('Failed to upsert delegated task into session:', error);
  }
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}
