import { spawn } from 'child_process';

export interface CommandExecResult {
  command: string[];
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  latencyMs: number;
  timedOut: boolean;
}

function truncate(text: string, max = 200000): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + `\n... (truncated to ${max} chars)`;
}

export async function runCommand(params: {
  command: string[];
  cwd: string;
  timeoutMs: number;
  env?: NodeJS.ProcessEnv;
}): Promise<CommandExecResult> {
  const [cmd, ...args] = params.command;
  const started = Date.now();

  return await new Promise(resolve => {
    const child = spawn(cmd, args, {
      cwd: params.cwd,
      env: params.env ?? process.env,
      shell: false,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const finalize = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({
        command: params.command,
        exitCode,
        signal,
        stdout: truncate(stdout),
        stderr: truncate(stderr),
        latencyMs: Date.now() - started,
        timedOut
      });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, params.timeoutMs);

    child.stdout?.on('data', buffer => {
      stdout += buffer.toString('utf-8');
    });

    child.stderr?.on('data', buffer => {
      stderr += buffer.toString('utf-8');
    });

    child.on('error', error => {
      stderr += error.message;
      finalize(null, null);
    });

    child.on('close', (exitCode, signal) => {
      finalize(exitCode, signal);
    });
  });
}
