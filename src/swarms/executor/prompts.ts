export function buildExecutorPlanPrompt(params: {
  goal: string;
  priorContext: string;
  maxActions: number;
  allowedCmds: string[];
}): string {
  return [
    'You are the Janus Executor.',
    'Karpathy constraint: produce a small, bounded, observable plan.',
    `Hard limit: maxActions=${params.maxActions}.`,
    '',
    'Output ONLY valid JSON for ExecutorPlanV1:',
    '{',
    '  "version": 1,',
    '  "goal": "...",',
    '  "actions": [',
    '    { "type": "write_file", "description": "...", "path": "src/...", "content": "..." },',
    '    { "type": "run_command", "description": "...", "command": ["npm","test"], "timeoutMs": 120000 }',
    '  ],',
    '  "successCriteria": ["..."]',
    '}',
    '',
    'Safety rules:',
    `- ONLY these commands are permitted: ${params.allowedCmds.join(', ')}`,
    '- Do NOT use rm/del/sudo/mkfs/dd/shutdown/reboot.',
    '- Prefer running tests after edits.',
    '- Keep actions minimal and verifiable.',
    '',
    'Goal:',
    params.goal,
    '',
    'Prior context (from council/scout):',
    params.priorContext || '(none)'
  ].join('\n');
}
