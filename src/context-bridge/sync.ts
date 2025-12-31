/**
 * Context Bridge - Git Sync Operations
 *
 * Synchronizes state with git repository
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';

const getContextPath = () => process.env.JANUS_CONTEXT_PATH || './janus-context';
const isAutoSyncDisabled = () => process.env.JANUS_CONTEXT_AUTO_SYNC === 'false';
const isStrictSync = () => process.env.JANUS_CONTEXT_SYNC_STRICT === 'true';
const hasGitRepo = (contextPath: string) => existsSync(path.join(contextPath, '.git'));

const handleSyncFailure = (error: unknown): void => {
  console.warn('Context sync failed:', error);
  if (isStrictSync()) {
    throw error;
  }
};

export async function syncContext(message: string): Promise<void> {
  const contextPath = getContextPath();

  if (isAutoSyncDisabled()) {
    console.log('Context auto-sync disabled; skipping git sync');
    return;
  }

  if (!hasGitRepo(contextPath)) {
    console.warn('Context sync skipped: git repo not initialized');
    return;
  }

  try {
    console.log(`Syncing context: ${message}`);

    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: contextPath,
      encoding: 'utf-8'
    });

    if (!status.trim()) {
      console.log('No context changes to sync');
      return;
    }

    execFileSync('git', ['add', '.'], { cwd: contextPath });
    execFileSync('git', ['commit', '-m', message], { cwd: contextPath });

    console.log('Context synced to git');

    try {
      execFileSync('git', ['push'], { cwd: contextPath });
      console.log('Pushed to remote');
    } catch {
      console.warn('Remote not configured, local sync only');
    }
  } catch (error) {
    handleSyncFailure(error);
  }
}

export async function loadContextHistory(): Promise<string[]> {
  const contextPath = getContextPath();
  if (!hasGitRepo(contextPath)) {
    return [];
  }

  try {
    const log = execFileSync('git', ['log', '--oneline'], {
      cwd: contextPath,
      encoding: 'utf-8'
    });
    return log.trim().split('\n').filter(line => line);
  } catch (error) {
    console.warn('Failed to load git history:', error);
    return [];
  }
}
