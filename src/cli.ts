#!/usr/bin/env node
/**
 * Janus CLI
 * Multi-Model AI Council Orchestration System
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config } from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

import type { CurrentFocus, Deliberation } from './types.js';

// Load environment
config();

const CONTEXT_ROOT = process.env.JANUS_CONTEXT_ROOT || './janus-context';

const program = new Command();

program
  .name('janus')
  .description(chalk.bold('Multi-Model AI Council Orchestration System') + '\n' +
    chalk.dim('Watch frontier models deliberate. See where they agree. See where they disagree.'))
  .version('0.1.0');

// =============================================================================
// Focus Command - Show current focus from context store
// =============================================================================

program
  .command('focus')
  .description('Show current focus from context store')
  .action(async () => {
    try {
      const focusPath = join(CONTEXT_ROOT, 'state/current-focus.json');
      
      if (!existsSync(focusPath)) {
        console.log(chalk.yellow('No focus set. Initialize with: janus init'));
        return;
      }
      
      const content = await readFile(focusPath, 'utf-8');
      const focus: CurrentFocus = JSON.parse(content);
      
      console.log(chalk.bold('\n📍 Current Focus\n'));
      console.log(chalk.blue('Objective:'), focus.objective);
      console.log(chalk.blue('Phase:'), focus.phase);
      console.log(chalk.blue('Blockers:'), focus.blockers.length > 0 
        ? focus.blockers.join(', ') 
        : chalk.green('None'));
      console.log(chalk.blue('Next Actions:'));
      focus.nextActions.forEach((action, i) => {
        console.log(chalk.dim(`  ${i + 1}.`), action);
      });
      console.log();
    } catch (error) {
      console.error(chalk.red('Error reading focus:'), error);
    }
  });

// =============================================================================
// Council Command - Convene the Council for deliberation
// =============================================================================

program
  .command('council')
  .description('Convene the Council to deliberate on a task')
  .argument('<task>', 'The task to deliberate on')
  .option('-o, --output <file>', 'Write results to file')
  .action(async (task: string, options: { output?: string }) => {
    const spinner = ora('Convening the Council...').start();
    
    // Check for API keys
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_API_KEY;
    
    if (!hasAnthropic && !hasOpenAI && !hasGoogle) {
      spinner.fail('No API keys configured');
      console.log(chalk.yellow('\nConfigure API keys in .env file:'));
      console.log(chalk.dim('  ANTHROPIC_API_KEY=sk-ant-...'));
      console.log(chalk.dim('  OPENAI_API_KEY=sk-...'));
      console.log(chalk.dim('  GOOGLE_API_KEY=AI...'));
      return;
    }
    
    spinner.text = 'Council deliberation not yet implemented';
    spinner.info();
    
    console.log(chalk.bold('\n🏛 Council Deliberation\n'));
    console.log(chalk.blue('Task:'), task);
    console.log();
    console.log(chalk.yellow('Implementation Status:'));
    console.log(chalk.dim('  [ ] Claude adapter'));
    console.log(chalk.dim('  [ ] GPT adapter'));
    console.log(chalk.dim('  [ ] Gemini adapter'));
    console.log(chalk.dim('  [ ] Parallel execution'));
    console.log(chalk.dim('  [ ] Disagreement detection'));
    console.log(chalk.dim('  [ ] Synthesis'));
    console.log();
    console.log(chalk.dim('See ARCHITECTURE.md for implementation roadmap.'));
  });

// =============================================================================
// Scout Command - Send scouts to verify resources
// =============================================================================

program
  .command('scout')
  .description('Send scouts to verify resources')
  .argument('<query>', 'What to search for')
  .action(async (query: string) => {
    const spinner = ora('Dispatching scouts...').start();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      spinner.fail('ANTHROPIC_API_KEY required for scout swarm');
      return;
    }
    
    spinner.text = 'Scout swarm not yet implemented';
    spinner.info();
    
    console.log(chalk.bold('\n🔭 Scout Mission\n'));
    console.log(chalk.blue('Query:'), query);
    console.log();
    console.log(chalk.yellow('Implementation Status:'));
    console.log(chalk.dim('  [ ] Haiku agent setup'));
    console.log(chalk.dim('  [ ] Parallel execution'));
    console.log(chalk.dim('  [ ] URL verification'));
    console.log(chalk.dim('  [ ] Stale resource detection'));
    console.log();
    console.log(chalk.dim('See ARCHITECTURE.md for implementation roadmap.'));
  });

// =============================================================================
// Run-Delegations Command - Execute pending tasks from context store
// =============================================================================

program
  .command('run-delegations')
  .description('Execute pending tasks from the context store')
  .action(async () => {
    const delegationsDir = join(CONTEXT_ROOT, 'state/delegations');
    
    if (!existsSync(delegationsDir)) {
      console.log(chalk.yellow('No delegations directory. Initialize first.'));
      return;
    }
    
    console.log(chalk.bold('\n⚡ Running Delegations\n'));
    console.log(chalk.dim('Checking for pending tasks in:'), delegationsDir);
    console.log();
    console.log(chalk.yellow('Task runner not yet implemented.'));
    console.log(chalk.dim('See ARCHITECTURE.md for implementation roadmap.'));
  });

// =============================================================================
// Sync Command - Sync context store with remote
// =============================================================================

program
  .command('sync')
  .description('Sync context store with remote')
  .action(async () => {
    const spinner = ora('Syncing context...').start();
    
    if (!existsSync(join(CONTEXT_ROOT, '.git'))) {
      spinner.fail('Context store is not a git repository');
      console.log(chalk.dim('\nInitialize with:'));
      console.log(chalk.dim('  cd janus-context && git init'));
      return;
    }
    
    spinner.text = 'Context sync not yet implemented';
    spinner.info();
    
    console.log(chalk.dim('\nWill run:'));
    console.log(chalk.dim('  git -C janus-context pull --rebase'));
    console.log(chalk.dim('  git -C janus-context add -A'));
    console.log(chalk.dim('  git -C janus-context commit -m "Auto-sync"'));
    console.log(chalk.dim('  git -C janus-context push'));
  });

// =============================================================================
// Info Command - Show system information
// =============================================================================

program
  .command('info')
  .description('Show system information and configuration')
  .action(async () => {
    console.log(chalk.bold('\n⚙️  Janus Configuration\n'));
    
    // API Keys
    console.log(chalk.blue('API Keys:'));
    console.log('  Anthropic:', process.env.ANTHROPIC_API_KEY 
      ? chalk.green('✓ configured') 
      : chalk.red('✗ missing'));
    console.log('  OpenAI:', process.env.OPENAI_API_KEY 
      ? chalk.green('✓ configured') 
      : chalk.red('✗ missing'));
    console.log('  Google:', process.env.GOOGLE_API_KEY 
      ? chalk.green('✓ configured') 
      : chalk.red('✗ missing'));
    
    // Context Store
    console.log();
    console.log(chalk.blue('Context Store:'));
    console.log('  Path:', CONTEXT_ROOT);
    console.log('  Exists:', existsSync(CONTEXT_ROOT) 
      ? chalk.green('✓') 
      : chalk.red('✗'));
    console.log('  Git:', existsSync(join(CONTEXT_ROOT, '.git')) 
      ? chalk.green('✓ initialized') 
      : chalk.yellow('○ not initialized'));
    
    // Models
    console.log();
    console.log(chalk.blue('Models:'));
    console.log('  Claude:', process.env.CLAUDE_MODEL || 'claude-opus-4-5-20251101');
    console.log('  GPT:', process.env.GPT_MODEL || 'gpt-5.1');
    console.log('  Gemini:', process.env.GEMINI_MODEL || 'gemini-3-pro');
    console.log('  Orchestrator:', process.env.ORCHESTRATOR_MODEL || 'claude-sonnet-4-5-20250929');
    console.log('  Swarm:', process.env.SWARM_MODEL || 'claude-3-5-haiku-20241022');
    
    console.log();
  });

// =============================================================================
// Default action - show help
// =============================================================================

program.action(() => {
  console.log(chalk.bold('\n🏛 JANUS'));
  console.log(chalk.dim('Multi-Model AI Council Orchestration System\n'));
  
  console.log(chalk.yellow('Commands:'));
  console.log('  janus focus          Show current focus');
  console.log('  janus council <task> Convene the Council');
  console.log('  janus scout <query>  Send scouts to verify resources');
  console.log('  janus run-delegations Execute pending tasks');
  console.log('  janus sync           Sync context with remote');
  console.log('  janus info           Show configuration');
  console.log();
  console.log(chalk.dim('Run "janus --help" for more information.'));
  console.log();
});

program.parse();
