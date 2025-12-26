#!/usr/bin/env node

/**
 * Janus CLI
 *
 * Command-line interface for the Janus orchestration system
 */

import * as dotenv from 'dotenv';
import { ContextBridge } from './context-bridge/index.js';
import JanusOrchestrator from './orchestrator.js';
import { OllamaCloud } from './ollama-cloud.js';

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
    console.log('  janus ollama          - Ollama cloud commands');
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
  },

  async ollama(args: string[]) {
    const subcommand = args[0];
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const apiKey = process.env.OLLAMA_API_KEY || '';
    const defaultModel = process.env.OLLAMA_MODEL || 'glm4:latest';

    if (!baseUrl) {
      console.error('❌ OLLAMA_BASE_URL not configured in .env');
      console.log('\nAdd to your .env file:');
      console.log('  OLLAMA_BASE_URL=http://localhost:11434');
      console.log('  OLLAMA_API_KEY=your-api-key  # if required');
      console.log('  OLLAMA_MODEL=glm4:latest');
      process.exit(1);
    }

    const client = new OllamaCloud({ apiKey, baseUrl });

    switch (subcommand) {
      case 'test':
        console.log(`\n🔌 Testing Ollama connection to ${baseUrl}...`);
        try {
          const models = await client.listModels();
          console.log('✅ Connection successful!');
          console.log(`\n📦 Available models (${models.length}):`);
          models.forEach(m => {
            const size = (m.size / 1e9).toFixed(1);
            console.log(`  - ${m.name} (${size} GB)`);
          });
        } catch (error: any) {
          console.error('❌ Connection failed:', error.message);
          process.exit(1);
        }
        break;

      case 'models':
        console.log(`\n📦 Fetching models from ${baseUrl}...`);
        try {
          const models = await client.listModels();
          if (models.length === 0) {
            console.log('   No models available. Pull a model first:');
            console.log('   ollama pull glm4');
            return;
          }
          models.forEach(m => {
            const size = (m.size / 1e9).toFixed(1);
            console.log(`  - ${m.name} (${size} GB)`);
            if (m.details) {
              console.log(`      Family: ${m.details.family}, Params: ${m.details.parameter_size}`);
            }
          });
        } catch (error: any) {
          console.error('❌ Failed to list models:', error.message);
          process.exit(1);
        }
        break;

      case 'chat':
        const model = args[1] || defaultModel;
        const message = args.slice(2).join(' ');

        if (!message) {
          console.error('Usage: janus ollama chat [model] <message>');
          console.log(`  Default model: ${defaultModel}`);
          console.log('\nExamples:');
          console.log('  janus ollama chat "Hello, how are you?"');
          console.log('  janus ollama chat glm4:latest "Explain quantum computing"');
          process.exit(1);
        }

        console.log(`\n🤖 Chatting with ${model}...`);
        console.log(`📝 You: ${message}\n`);

        try {
          const response = await client.chat(model, message);
          console.log(`💬 ${model}:`);
          console.log(response);
        } catch (error: any) {
          console.error('❌ Chat failed:', error.message);
          process.exit(1);
        }
        break;

      case 'generate':
        const genModel = args[1] || defaultModel;
        const prompt = args.slice(2).join(' ');

        if (!prompt) {
          console.error('Usage: janus ollama generate [model] <prompt>');
          process.exit(1);
        }

        console.log(`\n🤖 Generating with ${genModel}...`);

        try {
          const response = await client.generate(genModel, prompt);
          console.log(response);
        } catch (error: any) {
          console.error('❌ Generation failed:', error.message);
          process.exit(1);
        }
        break;

      default:
        console.log('\n🦙 Ollama Cloud Commands:');
        console.log(`  Base URL: ${baseUrl}`);
        console.log(`  Default Model: ${defaultModel}`);
        console.log(`  API Key: ${apiKey ? '(configured)' : '(not set)'}`);
        console.log('\nUsage:');
        console.log('  janus ollama test                     - Test connection');
        console.log('  janus ollama models                   - List available models');
        console.log('  janus ollama chat [model] <message>   - Chat with a model');
        console.log('  janus ollama generate [model] <prompt> - Generate text');
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
