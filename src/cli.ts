#!/usr/bin/env node
/**
 * Janus CLI
 * Multi-Model AI Council Orchestration System
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

// Types are validated via Zod schemas in errors.ts
import {
  setupGlobalErrorHandlers,
  handleCommandError,
  validateContextRoot,
  validateApiKeys,
  requireApiKeys,
  validateTaskInput,
  validateQueryInput,
  validateOutputPath,
  safeReadFile,
  safeJsonParse,
  CurrentFocusSchema,
  ConfigurationError,
  FileOperationError,
} from './errors.js';

// Set up global error handlers for unhandled rejections/exceptions
setupGlobalErrorHandlers();

// Load environment and check for errors
const envResult = config();
if (envResult.error) {
  // .env file is optional, but log in debug mode
  if (process.env.JANUS_DEBUG === 'true') {
    console.warn(chalk.dim('Note: No .env file found or error loading it'));
  }
}

// Validate and normalize the context root path
const CONTEXT_ROOT = validateContextRoot(
  process.env.JANUS_CONTEXT_ROOT || './janus-context'
);

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

      // Check if file exists and is actually a file (not a directory)
      if (!existsSync(focusPath)) {
        console.log(chalk.yellow('No focus set. Initialize with: janus init'));
        return;
      }

      try {
        const stats = statSync(focusPath);
        if (!stats.isFile()) {
          throw new FileOperationError(
            `Expected a file but found a directory: ${focusPath}`,
            focusPath,
            'Remove the directory and create a proper focus file'
          );
        }
      } catch (error) {
        if (error instanceof FileOperationError) throw error;
        // If stat fails, let readFile handle the error
      }

      // Read file with proper error handling
      const content = await safeReadFile(focusPath, readFile);

      // Parse and validate JSON structure using Zod schema
      const focus = safeJsonParse(content, CurrentFocusSchema, focusPath);

      console.log(chalk.bold('\n📍 Current Focus\n'));
      console.log(chalk.blue('Objective:'), focus.objective);
      console.log(chalk.blue('Phase:'), focus.phase);
      const blockers = focus.blockers ?? [];
      console.log(chalk.blue('Blockers:'), blockers.length > 0
        ? blockers.join(', ')
        : chalk.green('None'));
      console.log(chalk.blue('Next Actions:'));
      const nextActions = focus.nextActions ?? [];
      if (nextActions.length === 0) {
        console.log(chalk.dim('  No actions defined'));
      } else {
        nextActions.forEach((action: string, i: number) => {
          console.log(chalk.dim(`  ${i + 1}.`), action);
        });
      }
      if (focus.lastUpdated) {
        console.log(chalk.dim(`\nLast updated: ${focus.lastUpdated}`));
      }
      console.log();
    } catch (error) {
      handleCommandError(error, 'focus');
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

    try {
      // Validate the task input
      const validatedTask = validateTaskInput(task);

      // Validate output path if provided
      if (options.output) {
        validateOutputPath(options.output);
      }

      // Check for API keys with proper validation
      const apiStatus = validateApiKeys();

      if (!apiStatus.anyConfigured) {
        spinner.fail('No API keys configured');
        console.log(chalk.yellow('\nConfigure at least one API key in .env file:'));
        console.log(chalk.dim('  ANTHROPIC_API_KEY=sk-ant-...'));
        console.log(chalk.dim('  OPENAI_API_KEY=sk-...'));
        console.log(chalk.dim('  GOOGLE_API_KEY=AI...'));
        return;
      }

      // Log which models are available
      const available: string[] = [];
      if (apiStatus.anthropic) available.push('Claude');
      if (apiStatus.openai) available.push('GPT');
      if (apiStatus.google) available.push('Gemini');

      spinner.text = 'Council deliberation not yet implemented';
      spinner.info();

      console.log(chalk.bold('\n🏛 Council Deliberation\n'));
      console.log(chalk.blue('Task:'), validatedTask);
      console.log(chalk.blue('Available Models:'), available.join(', '));
      if (options.output) {
        console.log(chalk.blue('Output File:'), options.output);
      }
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
    } catch (error) {
      spinner.fail('Failed to convene Council');
      handleCommandError(error, 'council');
    }
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

    try {
      // Validate the query input
      const validatedQuery = validateQueryInput(query);

      // Require Anthropic API key for scout swarm (uses Haiku)
      try {
        requireApiKeys(['anthropic'], 'scout swarm');
      } catch (error) {
        spinner.fail('ANTHROPIC_API_KEY required for scout swarm');
        if (error instanceof ConfigurationError && error.suggestion) {
          console.log(chalk.yellow(`\n${error.suggestion}`));
        }
        return;
      }

      spinner.text = 'Scout swarm not yet implemented';
      spinner.info();

      console.log(chalk.bold('\n🔭 Scout Mission\n'));
      console.log(chalk.blue('Query:'), validatedQuery);
      console.log();
      console.log(chalk.yellow('Implementation Status:'));
      console.log(chalk.dim('  [ ] Haiku agent setup'));
      console.log(chalk.dim('  [ ] Parallel execution'));
      console.log(chalk.dim('  [ ] URL verification'));
      console.log(chalk.dim('  [ ] Stale resource detection'));
      console.log();
      console.log(chalk.dim('See ARCHITECTURE.md for implementation roadmap.'));
    } catch (error) {
      spinner.fail('Failed to dispatch scouts');
      handleCommandError(error, 'scout');
    }
  });

// =============================================================================
// Run-Delegations Command - Execute pending tasks from context store
// =============================================================================

program
  .command('run-delegations')
  .description('Execute pending tasks from the context store')
  .action(async () => {
    try {
      const delegationsDir = join(CONTEXT_ROOT, 'state/delegations');

      // Check if delegations directory exists
      if (!existsSync(delegationsDir)) {
        console.log(chalk.yellow('No delegations directory found.'));
        console.log(chalk.dim('Initialize with: janus init'));
        console.log(chalk.dim(`Expected location: ${delegationsDir}`));
        return;
      }

      // Verify it's actually a directory
      try {
        const stats = statSync(delegationsDir);
        if (!stats.isDirectory()) {
          throw new FileOperationError(
            `Expected a directory but found a file: ${delegationsDir}`,
            delegationsDir,
            'Remove the file and create a proper delegations directory'
          );
        }
      } catch (error) {
        if (error instanceof FileOperationError) throw error;
        throw new FileOperationError(
          `Cannot access delegations directory: ${delegationsDir}`,
          delegationsDir,
          'Check directory permissions'
        );
      }

      console.log(chalk.bold('\n⚡ Running Delegations\n'));
      console.log(chalk.dim('Checking for pending tasks in:'), delegationsDir);
      console.log();
      console.log(chalk.yellow('Task runner not yet implemented.'));
      console.log(chalk.dim('See ARCHITECTURE.md for implementation roadmap.'));
    } catch (error) {
      handleCommandError(error, 'run-delegations');
    }
  });

// =============================================================================
// Sync Command - Sync context store with remote
// =============================================================================

program
  .command('sync')
  .description('Sync context store with remote')
  .action(async () => {
    const spinner = ora('Syncing context...').start();

    try {
      const gitPath = join(CONTEXT_ROOT, '.git');

      // Check if context root exists first
      if (!existsSync(CONTEXT_ROOT)) {
        spinner.fail('Context store directory does not exist');
        console.log(chalk.dim(`\nExpected location: ${CONTEXT_ROOT}`));
        console.log(chalk.dim('Initialize with: janus init'));
        return;
      }

      // Check if .git exists
      if (!existsSync(gitPath)) {
        spinner.fail('Context store is not a git repository');
        console.log(chalk.dim('\nInitialize with:'));
        console.log(chalk.dim(`  cd ${CONTEXT_ROOT} && git init`));
        return;
      }

      // Verify .git is a directory (not a file)
      try {
        const stats = statSync(gitPath);
        if (!stats.isDirectory()) {
          spinner.fail('Invalid git repository structure');
          console.log(chalk.yellow('\n.git exists but is not a directory'));
          console.log(chalk.dim('This may be a git submodule or worktree. Check your git configuration.'));
          return;
        }
      } catch (error) {
        spinner.fail('Cannot access git repository');
        console.log(chalk.dim('\nCheck permissions for:'), gitPath);
        return;
      }

      spinner.text = 'Context sync not yet implemented';
      spinner.info();

      console.log(chalk.dim('\nWill run:'));
      console.log(chalk.dim(`  git -C ${CONTEXT_ROOT} pull --rebase`));
      console.log(chalk.dim(`  git -C ${CONTEXT_ROOT} add -A`));
      console.log(chalk.dim(`  git -C ${CONTEXT_ROOT} commit -m "Auto-sync"`));
      console.log(chalk.dim(`  git -C ${CONTEXT_ROOT} push`));
    } catch (error) {
      spinner.fail('Sync failed');
      handleCommandError(error, 'sync');
    }
  });

// =============================================================================
// Info Command - Show system information
// =============================================================================

program
  .command('info')
  .description('Show system information and configuration')
  .action(async () => {
    try {
      console.log(chalk.bold('\n⚙️  Janus Configuration\n'));

      // API Keys with proper validation
      const apiStatus = validateApiKeys();
      console.log(chalk.blue('API Keys:'));
      console.log('  Anthropic:', apiStatus.anthropic
        ? chalk.green('✓ configured')
        : chalk.red('✗ missing'));
      console.log('  OpenAI:', apiStatus.openai
        ? chalk.green('✓ configured')
        : chalk.red('✗ missing'));
      console.log('  Google:', apiStatus.google
        ? chalk.green('✓ configured')
        : chalk.red('✗ missing'));

      // Context Store with enhanced checks
      console.log();
      console.log(chalk.blue('Context Store:'));
      console.log('  Path:', CONTEXT_ROOT);

      const contextExists = existsSync(CONTEXT_ROOT);
      console.log('  Exists:', contextExists
        ? chalk.green('✓')
        : chalk.red('✗'));

      if (contextExists) {
        try {
          const stats = statSync(CONTEXT_ROOT);
          if (!stats.isDirectory()) {
            console.log('  Status:', chalk.yellow('⚠ Path exists but is not a directory'));
          } else {
            const gitPath = join(CONTEXT_ROOT, '.git');
            const hasGit = existsSync(gitPath);
            console.log('  Git:', hasGit
              ? chalk.green('✓ initialized')
              : chalk.yellow('○ not initialized'));

            if (hasGit) {
              try {
                const gitStats = statSync(gitPath);
                if (!gitStats.isDirectory()) {
                  console.log('  Note:', chalk.dim('Using git worktree or submodule'));
                }
              } catch {
                // Ignore stat errors for .git
              }
            }
          }
        } catch (error) {
          console.log('  Status:', chalk.yellow('⚠ Cannot access directory'));
        }
      }

      // Models with fallback display
      console.log();
      console.log(chalk.blue('Models:'));
      const getModel = (envVar: string, fallback: string): string => {
        const value = process.env[envVar];
        return value && value.trim() ? value.trim() : fallback;
      };

      console.log('  Claude:', getModel('CLAUDE_MODEL', 'claude-opus-4-5-20251101'));
      console.log('  GPT:', getModel('GPT_MODEL', 'gpt-5.1'));
      console.log('  Gemini:', getModel('GEMINI_MODEL', 'gemini-3-pro'));
      console.log('  Orchestrator:', getModel('ORCHESTRATOR_MODEL', 'claude-sonnet-4-5-20250929'));
      console.log('  Swarm:', getModel('SWARM_MODEL', 'claude-3-5-haiku-20241022'));

      // Debug mode status
      console.log();
      console.log(chalk.blue('Debug:'));
      console.log('  JANUS_DEBUG:', process.env.JANUS_DEBUG === 'true'
        ? chalk.green('enabled')
        : chalk.dim('disabled'));

      console.log();
    } catch (error) {
      handleCommandError(error, 'info');
    }
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
