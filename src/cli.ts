#!/usr/bin/env node

/**
 * Janus CLI
 *
 * Command-line interface for the Janus orchestration system
 */

import * as dotenv from 'dotenv';
import { ContextBridge } from './context-bridge/index.js';
import JanusOrchestrator from './orchestrator.js';

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
