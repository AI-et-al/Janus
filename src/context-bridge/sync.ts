/**
 * Context Bridge - Git Sync Operations
 *
 * Synchronizes state with git repository
 */

import { execSync } from 'child_process';

const getContextPath = () => process.env.JANUS_CONTEXT_PATH || './janus-context';

export async function syncContext(message: string): Promise<void> {
  try {
    console.log(`Syncing context: ${message}`);

    // Git add all changes
    execSync('git add .', { cwd: getContextPath() });

    // Commit with message
    execSync(`git commit -m "${message}"`, { cwd: getContextPath() });

    console.log('✅ Context synced to git');

    // Optional: push to remote (if configured)
    try {
      execSync('git push', { cwd: getContextPath() });
      console.log('✅ Pushed to remote');
    } catch {
      console.warn('⚠️  Remote not configured, local sync only');
    }
  } catch (error) {
    console.error('Context sync failed:', error);
    throw error;
  }
}

export async function loadContextHistory(): Promise<string[]> {
  try {
    const log = execSync('git log --oneline', {
      cwd: getContextPath(),
      encoding: 'utf-8'
    });
    return log.trim().split('\n').filter(line => line);
  } catch (error) {
    console.warn('Failed to load git history:', error);
    return [];
  }
}
