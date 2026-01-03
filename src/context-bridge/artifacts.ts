import * as fs from 'fs/promises';
import * as path from 'path';

const getContextPath = () => process.env.JANUS_CONTEXT_PATH || './janus-context';

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

function safeRelPath(rel: string): string {
  if (path.isAbsolute(rel)) {
    throw new Error(`Artifact path must be relative: ${rel}`);
  }

  const normalized = rel.replace(/\\/g, '/');
  if (normalized.includes('..')) {
    throw new Error(`Artifact path traversal blocked: ${rel}`);
  }

  return normalized;
}

export async function writeArtifactText(params: {
  sessionId: string;
  taskId: string;
  name: string;
  text: string;
}): Promise<string> {
  const relName = safeRelPath(params.name);
  const baseDir = path.join(getContextPath(), 'artifacts', params.sessionId, params.taskId);
  const absPath = path.join(baseDir, relName);

  await ensureDir(path.dirname(absPath));
  await fs.writeFile(absPath, params.text, 'utf-8');

  return path.join('artifacts', params.sessionId, params.taskId, relName).replace(/\\/g, '/');
}

export async function writeArtifactJson(params: {
  sessionId: string;
  taskId: string;
  name: string;
  data: unknown;
}): Promise<string> {
  return writeArtifactText({
    sessionId: params.sessionId,
    taskId: params.taskId,
    name: params.name,
    text: JSON.stringify(params.data, null, 2)
  });
}
