import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

export interface ScoutTask {
  id: string;
  query: string;
  type: 'url-verify' | 'package-check' | 'doc-search' | 'general-query';
  context?: string;
}

export interface ScoutResult {
  taskId: string;
  status: 'success' | 'failure';
  data: any;
  error?: string;
  timestamp: string;
  agentId: string;
  reasoning?: string;
}

const SCOUT_SYSTEM_PROMPT = `You are a Scout agent for the Janus system.

THE GOLDEN RULE:
If you cannot provide a URL, install command, or specific citation — YOU HAVE FAILED.

For every resource you mention:
| Resource Type | Required |
|---------------|----------|
| Library/Package | npm install X or pip install X |
| API/Service | Documentation URL |
| Tool/Framework | GitHub repo or official site |

Stale Resource Detection:
- Last update > 2 years ago → Flag it: ⚠️ STALE
- Better-maintained alternative exists → Mention it

You are the reality check. Speculation is forbidden.

Respond in JSON format with:
{
  "verified": true/false,
  "data": { /* your findings */ },
  "reasoning": "explanation of what you found",
  "warnings": ["any warnings about staleness, alternatives, etc"]
}`;

export class ScoutSwarm {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Execute a batch of scout tasks in parallel
   */
  async execute(tasks: ScoutTask[]): Promise<ScoutResult[]> {
    console.log(`[ScoutSwarm] Dispatching ${tasks.length} scouts...`);
    
    // Execute all tasks in parallel
    const results = await Promise.all(
      tasks.map(task => this.executeSingleTask(task))
    );

    return results;
  }

  private async executeSingleTask(task: ScoutTask): Promise<ScoutResult> {
    const agentId = `scout-${uuidv4().slice(0, 8)}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${agentId}] Processing task: ${task.type} - ${task.query}`);
      
      let data: any = {};
      let reasoning = '';
      
      switch (task.type) {
        case 'url-verify':
          ({ data, reasoning } = await this.verifyUrl(task.query, agentId));
          break;
        case 'package-check':
          ({ data, reasoning } = await this.checkPackage(task.query, agentId));
          break;
        case 'doc-search':
        case 'general-query':
          ({ data, reasoning } = await this.performLLMQuery(task, agentId));
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      const latency = Date.now() - startTime;
      console.log(`[${agentId}] ✅ Complete in ${latency}ms`);

      return {
        taskId: task.id,
        status: 'success',
        data,
        reasoning,
        timestamp: new Date().toISOString(),
        agentId
      };

    } catch (error: any) {
      console.error(`[${agentId}] ❌ Failed:`, error.message);
      return {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: error.message,
        timestamp: new Date().toISOString(),
        agentId
      };
    }
  }

  /**
   * Verify if a URL is accessible
   */
  private async verifyUrl(url: string, _agentId: string): Promise<{ data: any; reasoning: string }> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on non-2xx
        maxRedirects: 5
      });

      const verified = response.status >= 200 && response.status < 400;
      
      return {
        data: {
          verified,
          statusCode: response.status,
          url,
          accessible: verified,
          redirected: response.request?.res?.responseUrl !== url
        },
        reasoning: verified 
          ? `URL is accessible (HTTP ${response.status})`
          : `URL returned HTTP ${response.status}`
      };
    } catch (error: any) {
      return {
        data: {
          verified: false,
          url,
          accessible: false,
          error: error.message
        },
        reasoning: `Failed to access URL: ${error.message}`
      };
    }
  }

  /**
   * Check if an npm package exists and get its info
   */
  private async checkPackage(packageName: string, _agentId: string): Promise<{ data: any; reasoning: string }> {
    try {
      const response = await axios.get(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
        { timeout: 5000 }
      );

      const pkg = response.data;
      const latestVersion = pkg['dist-tags']?.latest || 'unknown';
      const lastModified = pkg.time?.[latestVersion] || pkg.time?.modified;
      
      // Check if stale (>2 years)
      const isStale = lastModified 
        ? (Date.now() - new Date(lastModified).getTime()) > (2 * 365 * 24 * 60 * 60 * 1000)
        : false;

      return {
        data: {
          exists: true,
          name: pkg.name,
          version: latestVersion,
          lastUpdated: lastModified,
          description: pkg.description,
          homepage: pkg.homepage,
          repository: pkg.repository?.url,
          isStale,
          installCommand: `npm install ${pkg.name}`
        },
        reasoning: isStale 
          ? `⚠️ Package exists but is STALE (last updated: ${lastModified})`
          : `Package exists and is actively maintained (version ${latestVersion})`
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          data: {
            exists: false,
            name: packageName
          },
          reasoning: `Package "${packageName}" not found in npm registry`
        };
      }
      throw error;
    }
  }

  /**
   * Perform a general query or doc search using Claude Haiku
   */
  private async performLLMQuery(task: ScoutTask, _agentId: string): Promise<{ data: any; reasoning: string }> {
    const userPrompt = task.context 
      ? `${task.query}\n\nContext: ${task.context}`
      : task.query;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: SCOUT_SYSTEM_PROMPT,
      messages: [
        { 
          role: 'user', 
          content: userPrompt 
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content.text);
      return {
        data: parsed.data || parsed,
        reasoning: parsed.reasoning || 'LLM query completed'
      };
    } catch {
      // If not JSON, return as plain text
      return {
        data: { 
          result: content.text,
          type: task.type 
        },
        reasoning: 'Query processed by Claude Haiku'
      };
    }
  }
}