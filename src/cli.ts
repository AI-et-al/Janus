#!/usr/bin/env node

/**
 * Janus CLI
 *
 * Command-line interface for the Janus orchestration system
 */

import * as dotenv from 'dotenv';
import { ContextBridge } from './context-bridge/index.js';
import { getBudgetStatus } from './budget.js';
import JanusOrchestrator from './orchestrator.js';
import { v4 as uuidv4 } from 'uuid';
import { recomputeModelTierSnapshot } from './model-feedback.js';

dotenv.config();

const bridge = new ContextBridge();
let orchestrator: JanusOrchestrator | null = null;

// Lazy initialization of orchestrator (requires API keys)
function getOrchestrator(): JanusOrchestrator {
  if (!orchestrator) {
    orchestrator = new JanusOrchestrator();
  }
  return orchestrator;
}

const commands: Record<string, (args: string[]) => Promise<void>> = {
  async execute([task]) {
    if (!task) {
      console.error('Usage: janus execute <task description>');
      process.exit(1);
    }

    try {
      const orch = getOrchestrator();
      const sessionId = await orch.executeTask(task);
      console.log(`\n✅ Task execution complete`);
      console.log(`   Session: ${sessionId.substring(0, 8)}...`);

      const budget = orch.getBudgetStatus();
      console.log(`\n💰 Budget Status:`);
      console.log(`   Monthly: $${budget.monthlyBudget}`);
      console.log(`   Spent: $${budget.spent.toFixed(2)}`);
      console.log(`   Remaining: $${budget.remaining.toFixed(2)}`);
      console.log(`   Used: ${budget.percentageUsed.toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Task execution failed:', error);
      process.exit(1);
    }
  },

  async budget([action, value]) {
    const subcommand = action || 'show';

    if (subcommand === 'set') {
      if (!value) {
        console.error('Usage: janus budget set <monthlyBudgetUsd>');
        process.exit(1);
      }

      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) {
        console.error('Monthly budget must be a non-negative number.');
        process.exit(1);
      }

      const config = await bridge.updateBudgetConfig(amount);
      console.log('\nBudget override saved.');
      console.log(`  Monthly: $${config.monthlyBudget}`);
      console.log(`  Updated: ${config.updatedAt}`);
      return;
    }

    if (subcommand === 'clear' || subcommand === 'reset') {
      await bridge.clearBudgetConfig();
      console.log('\nBudget override cleared.');
      console.log('  Using JANUS_BUDGET_MONTHLY or default $150.');
      return;
    }

    if (subcommand !== 'show') {
      console.error('Usage: janus budget [show|set|clear] [monthlyBudgetUsd]');
      process.exit(1);
    }

    const status = getBudgetStatus();
    const override = await bridge.getBudgetConfig();
    console.log('\nBudget Status:');
    console.log(`  Monthly: $${status.monthlyBudget}`);
    console.log(`  Spent: $${status.spent.toFixed(2)}`);
    console.log(`  Remaining: $${status.remaining.toFixed(2)}`);
    console.log(`  Used: ${status.percentageUsed.toFixed(1)}%`);
    if (override) {
      console.log(`  Override: $${override.monthlyBudget} (set ${override.updatedAt})`);
    } else {
      console.log('  Override: none');
    }
  },

  async models([action]) {
    const subcommand = action || 'show';

    if (subcommand === 'show' || subcommand === 'list') {
      const catalog = await bridge.getModelRouterConfig();
      if (!catalog?.models?.length) {
        console.log('\nNo model catalog found at janus-context/state/models.json.');
        return;
      }

      const freshness = await bridge.getModelCatalogStatus();
      const snapshot = await bridge.getModelTierSnapshot();
      console.log('\nModels (base vs learned tier):');

      for (const model of catalog.models) {
        const learned = snapshot?.tiers?.[model.key] ?? model.quality;
        const score = snapshot?.scores?.[model.key];
        const avg = snapshot?.avgRatings?.[model.key];
        const count = snapshot?.ratingCounts?.[model.key] ?? 0;

        console.log(`\n- ${model.key} (${model.provider}/${model.model})`);
        console.log(`  Base tier:    ${model.quality}`);
        console.log(`  Learned tier: ${learned}`);
        if (snapshot) {
          const avgText = typeof avg === 'number' ? avg.toFixed(2) : 'n/a';
          const scoreText = typeof score === 'number' ? score.toFixed(3) : 'n/a';
          console.log(`  Ratings:      ${count} (avg=${avgText}, score=${scoreText})`);
        }
      }

      if (snapshot) {
        console.log(`\nTier snapshot: ${snapshot.generatedAt} (${snapshot.algorithm})`);
      } else {
        console.log('\nTier snapshot: none (will appear after ratings accumulate)');
      }

      if (freshness) {
        const last = freshness.lastVerifiedAt || 'never';
        console.log(`\nCatalog freshness: ${freshness.status} (last verified ${last}, ttl ${freshness.ttlHours}h)`);
        if (!freshness.criticalOk) {
          console.log('Critical keys missing or stale; oracle refresh recommended.');
        }
      } else {
        console.log('\nCatalog freshness: unknown (no status file found)');
      }
      return;
    }

    if (subcommand === 'recompute') {
      const catalog = await bridge.getModelRouterConfig();
      if (!catalog?.models?.length) {
        console.error('No model catalog found at janus-context/state/models.json.');
        process.exit(1);
      }

      const allRatings = await bridge.listModelRatings();
      const previous = await bridge.getModelTierSnapshot();
      const snapshot = recomputeModelTierSnapshot(catalog, allRatings, { previous });
      await bridge.saveModelTierSnapshot(snapshot);
      await bridge.sync('Recomputed model tiers from peer ratings');
      console.log('\nRecomputed model tiers and synced context.');
      return;
    }

    if (subcommand === 'reset') {
      await bridge.clearModelTierSnapshot();
      await bridge.sync('Reset model tier snapshot');
      console.log('\nCleared learned tier snapshot and synced context.');
      return;
    }

    console.error('Usage: janus models [show|recompute|reset]');
    process.exit(1);
  },

  async rate([ratingStr, ...notes]) {
    const rating = Number(ratingStr);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      console.error('Usage: janus rate <1-5> [notes]');
      process.exit(1);
    }

    const lastRun = await bridge.getLastModelRun();
    if (!lastRun) {
      console.error('No last model run found at janus-context/state/last-model-run.json.');
      process.exit(1);
    }

    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      sessionId: lastRun.sessionId ?? 'unknown',
      fromModelKey: 'human',
      toModelKey: lastRun.modelKey,
      toTaskId: lastRun.taskId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      rationale: notes.length ? notes.join(' ') : undefined,
      method: 'manual' as const,
      toCostUsd: lastRun.costUsd,
      toLatencyMs: lastRun.latencyMs
    };

    await bridge.appendModelRating(event);

    const catalog = await bridge.getModelRouterConfig();
    if (catalog?.models?.length) {
      const allRatings = await bridge.listModelRatings();
      const previous = await bridge.getModelTierSnapshot();
      const snapshot = recomputeModelTierSnapshot(catalog, allRatings, { previous });
      await bridge.saveModelTierSnapshot(snapshot);
    }

    await bridge.sync(`Manual model rating: ${lastRun.modelKey}=${rating}`);
    console.log(`\nSaved rating ${rating} for ${lastRun.modelKey} and synced context.`);
  },

  async hello() {
    console.log('\n👋 Yes, I am communicating with you!');
    console.log('\n🔱 Janus is operational and ready to assist.');
    console.log('\nI can help you with:');
    console.log('  • Multi-model AI orchestration');
    console.log('  • Task execution across Claude, GPT, and other models');
    console.log('  • Persistent context management');
    console.log('  • Cost-aware model routing');
    console.log('\nTry: janus info    - for more commands');
  },

  async info() {
    console.log('\n🔱 Janus Multi-Model AI Orchestration System');
    console.log('Version: 0.1.0 (Development)');
    console.log('Status: Context Bridge Foundation');
    console.log('\nUsage:');
    console.log('  janus hello           - Verify communication');
    console.log('  janus execute <task>  - Execute a task');
    console.log('  janus sessions        - List all sessions');
    console.log('  janus focus           - Show current focus');
    console.log('  janus history         - Show git history');
    console.log('  janus budget show     - Show budget status');
    console.log('  janus budget set <n>  - Override monthly budget');
    console.log('  janus budget clear    - Remove override');
    console.log('  janus models          - Show model tiers (base vs learned)');
    console.log('  janus models recompute - Recompute tiers from ratings');
    console.log('  janus models reset    - Clear learned tier snapshot');
    console.log('  janus rate <1-5> [notes] - Manually rate last model run');
    console.log('  janus info            - Show this help');
  },

  async sessions() {
    const sessions = await bridge.listSessions();
    console.log(`\n📚 Sessions (${sessions.length} total):`);

    if (sessions.length === 0) {
      console.log('   No sessions yet');
      return;
    }

    for (const sessionId of sessions) {
      try {
        const session = await bridge.loadSession(sessionId);
        console.log(`  - ${session.id.substring(0, 8)}... (${session.started})`);
        console.log(`    ${session.summary}`);
      } catch (error) {
        console.log(`  - ${sessionId} (error loading)`);
      }
    }
  },

  async focus() {
    const focus = await bridge.getCurrentFocus();
    console.log('\n🎯 Current Focus:');
    console.log(`  Objective: ${focus.objective}`);
    console.log(`  Phase: ${focus.phase}`);

    if (focus.blockers.length > 0) {
      console.log(`  Blockers: ${focus.blockers.join(', ')}`);
    }

    if (focus.nextActions.length > 0) {
      console.log('  Next Actions:');
      focus.nextActions.forEach((action: string) => {
        console.log(`    • ${action}`);
      });
    }
  },

  async history() {
    const history = await bridge.getHistory();
    console.log('\n📜 Context Git History:');

    if (history.length === 0) {
      console.log('   No commits yet');
      return;
    }

    history.slice(0, 10).forEach((line: string) => {
      console.log(`  ${line}`);
    });

    if (history.length > 10) {
      console.log(`  ... and ${history.length - 10} more`);
    }
  }
};

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '-h' || command === '--help') {
    await commands.info([]);
    process.exit(0);
  }

  const handler = commands[command];
  if (!handler) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('\nAvailable commands:');
    Object.keys(commands).forEach(cmd => {
      console.log(`  - janus ${cmd}`);
    });
    process.exit(1);
  }

  try {
    await handler(args);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
