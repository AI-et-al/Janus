/**
 * Ollama Cloud Client
 *
 * Provides access to Ollama cloud-hosted models via API.
 * Supports both chat completions and text generation.
 *
 * Usage:
 *   const client = new OllamaCloud({ apiKey: 'your-key', baseUrl: 'https://your-ollama-instance.com' });
 *   const response = await client.chat('llama3.2', 'Hello!');
 */

export interface OllamaCloudConfig {
  apiKey: string;
  baseUrl: string;  // e.g., 'https://api.ollama.ai' or your self-hosted instance
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;  // max tokens
    stop?: string[];
  };
}

export interface OllamaGenerateOptions {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export class OllamaCloud {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: OllamaCloudConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');  // Remove trailing slash
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Chat completion - send messages and get a response
   */
  async chat(
    model: string,
    message: string,
    options?: {
      systemPrompt?: string;
      conversationHistory?: OllamaChatMessage[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: OllamaChatMessage[] = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options?.conversationHistory) {
      messages.push(...options.conversationHistory);
    }

    messages.push({ role: 'user', content: message });

    const body: OllamaChatOptions = {
      model,
      messages,
      stream: false,
      options: {},
    };

    if (options?.temperature !== undefined) {
      body.options!.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      body.options!.num_predict = options.maxTokens;
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(
        errorData.error || errorData.message || `Ollama API error: ${response.status}`
      );
    }

    const data = await response.json() as OllamaChatResponse;
    return data.message?.content || 'No response received';
  }

  /**
   * Text generation - generate text from a prompt
   */
  async generate(
    model: string,
    prompt: string,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const body: OllamaGenerateOptions = {
      model,
      prompt,
      stream: false,
      options: {},
    };

    if (options?.systemPrompt) {
      body.system = options.systemPrompt;
    }
    if (options?.temperature !== undefined) {
      body.options!.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      body.options!.num_predict = options.maxTokens;
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(
        errorData.error || errorData.message || `Ollama API error: ${response.status}`
      );
    }

    const data = await response.json() as OllamaGenerateResponse;
    return data.response || 'No response received';
  }

  /**
   * List available models on the Ollama instance
   */
  async listModels(): Promise<OllamaModel[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(
        errorData.error || errorData.message || `Ollama API error: ${response.status}`
      );
    }

    const data = await response.json() as OllamaModelsResponse;
    return data.models || [];
  }

  /**
   * Test connection to the Ollama instance
   */
  async testConnection(model?: string): Promise<boolean> {
    try {
      // First try to list models
      const models = await this.listModels();

      if (model) {
        // If a specific model is requested, verify it exists and can respond
        const modelExists = models.some(m => m.name === model || m.name.startsWith(model));
        if (!modelExists) {
          throw new Error(`Model "${model}" not found. Available models: ${models.map(m => m.name).join(', ')}`);
        }

        // Test with a simple prompt
        await this.chat(model, 'Hi', { maxTokens: 5 });
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get model info
   */
  async showModel(model: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/api/show`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name: model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(
        errorData.error || errorData.message || `Ollama API error: ${response.status}`
      );
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  /**
   * Pull a model (download it to the Ollama instance)
   */
  async pullModel(model: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name: model, stream: false }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(
        errorData.error || errorData.message || `Ollama API error: ${response.status}`
      );
    }
  }

  /**
   * Generate embeddings for text
   */
  async embeddings(model: string, prompt: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ model, prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(
        errorData.error || errorData.message || `Ollama API error: ${response.status}`
      );
    }

    const data = await response.json() as { embedding?: number[] };
    return data.embedding || [];
  }
}

/**
 * Create an Ollama cloud client from environment variables
 */
export function createOllamaClient(): OllamaCloud | null {
  const apiKey = process.env.OLLAMA_API_KEY;
  const baseUrl = process.env.OLLAMA_BASE_URL;

  if (!baseUrl) {
    return null;
  }

  return new OllamaCloud({
    apiKey: apiKey || '',
    baseUrl,
  });
}

export default OllamaCloud;
