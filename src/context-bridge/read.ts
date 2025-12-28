/**
 * Context Bridge - Read Operations
 *
 * Reads persistent state from janus-context/ directory
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Session, Decision, Task, CurrentFocus } from '../types.js';

const getContextPath = () => process.env.JANUS_CONTEXT_PATH || './janus-context';

export async function loadSession(id: string): Promise<Session> {
  const sessionPath = path.join(getContextPath(), 'sessions', `${id}.json`);
  const content = await fs.readFile(sessionPath, 'utf-8');
  return JSON.parse(content);
}

export async function listSessions(): Promise<string[]> {
  try {
    const sessionsDir = path.join(getContextPath(), 'sessions');
    const files = await fs.readdir(sessionsDir);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    console.warn('No sessions found:', error);
    return [];
  }
}

export async function loadDecision(id: string): Promise<Decision> {
  const decisionsDir = path.join(getContextPath(), 'decisions');
  try {
    const files = await fs.readdir(decisionsDir);
    const decisionFile = files.find(f => f.includes(id));

    if (!decisionFile) {
      throw new Error(`Decision ${id} not found`);
    }

    const content = await fs.readFile(
      path.join(decisionsDir, decisionFile),
      'utf-8'
    );

    return parseDecisionMarkdown(content, decisionFile);
  } catch (error) {
    console.error('Failed to load decision:', error);
    throw error;
  }
}

export async function listDecisions(): Promise<string[]> {
  try {
    const decisionsDir = path.join(getContextPath(), 'decisions');
    const files = await fs.readdir(decisionsDir);
    return files.filter(f => f.endsWith('.md'));
  } catch (error) {
    console.warn('No decisions found:', error);
    return [];
  }
}

export async function getCurrentFocus(): Promise<CurrentFocus> {
  const focusPath = path.join(getContextPath(), 'state', 'current-focus.json');
  try {
    const content = await fs.readFile(focusPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load current focus:', error);
    throw error;
  }
}

export async function loadTask(id: string): Promise<Task> {
  const taskPath = path.join(getContextPath(), 'state', 'delegations', `${id}.json`);
  const content = await fs.readFile(taskPath, 'utf-8');
  return JSON.parse(content);
}

export async function listTasks(): Promise<Task[]> {
  try {
    const delegationsDir = path.join(getContextPath(), 'state', 'delegations');
    const files = await fs.readdir(delegationsDir);

    const tasks = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(f => loadTask(f.replace('.json', '')))
    );

    return tasks;
  } catch (error) {
    console.warn('No tasks found:', error);
    return [];
  }
}

function parseDecisionMarkdown(content: string, filename: string): Decision {
  // Simple markdown parser for decision files
  // Format: DECISION_ID-topic.md
  const parts = filename.replace('.md', '').split('-');
  const date = parts[0]; // YYYY-MM-DD
  const topic = parts.slice(1).join('-');

  // Extract structured data from markdown
  const decisionMatch = content.match(/## Decision\n\n([\s\S]*?)\n## Rationale/);
  const rationaleMatch = content.match(/## Rationale\n\n([\s\S]*?)\n## Alternatives/);
  const alternativesMatch = content.match(/## Alternatives Considered\n\n([\s\S]*?)$/);

  return {
    id: filename.replace('.md', ''),
    date,
    timestamp: new Date(date).toISOString(), // Derive from date
    topic: topic.replace(/-/g, ' '),
    decision: decisionMatch ? decisionMatch[1].trim() : '',
    rationale: rationaleMatch ? rationaleMatch[1].trim() : '',
    madeBy: 'human', // Default, would be extracted from frontmatter
    confidence: 80, // Default, would be extracted from frontmatter
    reversible: true, // Default, would be extracted from frontmatter
    alternatives: alternativesMatch
      ? alternativesMatch[1]
        .split('\n')
        .filter(l => l.trim().startsWith('-'))
        .map(l => l.replace(/^-\s*/, '').trim())
      : []
  };
}
