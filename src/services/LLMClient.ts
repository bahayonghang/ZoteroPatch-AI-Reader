/**
 * LLM Client Service
 * Handles communication with OpenAI-compatible LLM endpoints
 */

import type { ChatMessage, StreamCallbacks } from '../types';

export interface LLMClientOptions {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableStreaming?: boolean;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export class LLMClient {
  private options: LLMClientOptions;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private abortController: AbortController | null = null;

  constructor(options: LLMClientOptions) {
    this.options = {
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      enableStreaming: true,
      ...options,
    };

    console.log('[LLMClient] Initialized with model:', this.options.model);
  }

  /**
   * Send chat completion request
   */
  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    console.log(`[LLMClient] Sending chat request with ${messages.length} messages`);

    try {
      const response = await this.sendRequestWithRetry(messages);
      return response;
    } catch (error) {
      console.error('[LLMClient] Chat request failed:', error);
      throw new Error(`LLM request failed: ${error}`);
    }
  }

  /**
   * Translate text
   */
  async translate(text: string, targetLanguage: string = 'zh-CN'): Promise<string> {
    console.log(`[LLMClient] Translating to ${targetLanguage}`);

    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translation, no explanations.`,
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      },
    ];

    const response = await this.chat(messages);
    return response.content;
  }

  /**
   * Explain text
   */
  async explain(text: string, language: string = 'zh-CN'): Promise<string> {
    console.log('[LLMClient] Explaining text');

    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'system',
        content: `You are a helpful assistant. Explain the following text in simple terms in ${language}.`,
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      },
    ];

    const response = await this.chat(messages);
    return response.content;
  }

  /**
   * Summarize text
   */
  async summarize(text: string, language: string = 'zh-CN'): Promise<string> {
    console.log('[LLMClient] Summarizing text');

    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'system',
        content: `You are a helpful assistant. Create a concise summary of the following text in ${language}. Focus on key points and main ideas.`,
        timestamp: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      },
    ];

    const response = await this.chat(messages);
    return response.content;
  }

  /**
   * Send request with retry logic
   */
  private async sendRequestWithRetry(messages: ChatMessage[], retries: number = 0): Promise<LLMResponse> {
    try {
      return await this.sendRequest(messages);
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        console.warn(`[LLMClient] Request failed, retrying (${retries + 1}/${this.MAX_RETRIES})...`);
        await this.delay(this.RETRY_DELAY_MS * (retries + 1));
        return this.sendRequestWithRetry(messages, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Send HTTP request to LLM endpoint
   */
  private async sendRequest(messages: ChatMessage[]): Promise<LLMResponse> {
    const url = `${this.options.apiEndpoint}/chat/completions`;

    const requestBody = {
      model: this.options.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this.options.temperature,
      max_tokens: this.options.maxTokens,
    };

    console.log('[LLMClient] Sending request to:', url);

    try {
      // Use Zotero's HTTP client
      const response = await this.fetchWithZotero(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        timeout: this.options.timeout,
      });

      const data = JSON.parse(response);

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from LLM');
      }

      const content = data.choices[0].message.content;
      const usage = data.usage;

      console.log('[LLMClient] Request successful, tokens used:', usage?.total_tokens);

      return {
        content,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('[LLMClient] Request error:', error);
      throw error;
    }
  }

  /**
   * Fetch using Zotero's HTTP client
   */
  private async fetchWithZotero(url: string, options: FetchOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Components.interfaces.nsIXMLHttpRequest);

      xhr.open(options.method || 'GET', url, true);

      // Set headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      // Set timeout
      if (options.timeout) {
        xhr.timeout = options.timeout;
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Request timeout'));
      };

      // Send request
      xhr.send(options.body || null);
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to LLM API
   * Sends a minimal request to verify API connectivity and credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    console.log('[LLMClient] Testing connection...');

    try {
      // Send a minimal test message
      const testMessages: ChatMessage[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ];

      // Use a shorter timeout for connection test
      const originalTimeout = this.options.timeout;
      this.options.timeout = 10000; // 10 seconds for test

      try {
        await this.sendRequest(testMessages);
        this.options.timeout = originalTimeout;

        console.log('[LLMClient] Connection test successful');
        return {
          success: true,
          message: '连接成功！API 配置正确。',
        };
      } catch (error) {
        this.options.timeout = originalTimeout;
        throw error;
      }
    } catch (error) {
      console.error('[LLMClient] Connection test failed:', error);

      let errorMessage = '连接失败';
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'API Key 无效或未授权';
        } else if (error.message.includes('404')) {
          errorMessage = 'API 端点不存在，请检查 URL';
        } else if (error.message.includes('timeout')) {
          errorMessage = '连接超时，请检查网络或端点地址';
        } else if (error.message.includes('Network error')) {
          errorMessage = '网络错误，请检查网络连接';
        } else {
          errorMessage = `连接失败: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update client options
   */
  updateOptions(options: Partial<LLMClientOptions>): void {
    this.options = { ...this.options, ...options };
    console.log('[LLMClient] Options updated');
  }

  /**
   * Get current options (without API key)
   */
  getOptions(): Omit<LLMClientOptions, 'apiKey'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey: _apiKey, ...safeOptions } = this.options;
    return safeOptions;
  }

  // ========================================
  // Streaming Support
  // ========================================

  /**
   * Send chat completion request with streaming
   */
  async streamChat(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    console.log(`[LLMClient] Starting stream chat with ${messages.length} messages`);

    const url = `${this.options.apiEndpoint}/chat/completions`;
    const requestBody = {
      model: this.options.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this.options.temperature,
      max_tokens: this.options.maxTokens,
      stream: true,
    };

    this.abortController = new AbortController();
    callbacks.onStart?.();

    try {
      await this.fetchWithZoteroStreamSimple(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        onChunk: (chunk: string) => {
          callbacks.onChunk?.(chunk);
        },
        onComplete: (fullText: string) => {
          callbacks.onComplete?.(fullText);
        },
        onError: (error: Error) => {
          callbacks.onError?.(error);
        },
        signal: this.abortController.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[LLMClient] Stream aborted by user');
        return;
      }
      console.error('[LLMClient] Stream error:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Abort ongoing stream request
   */
  abortStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('[LLMClient] Stream aborted');
    }
  }

  /**
   * Check if streaming is in progress
   */
  isStreaming(): boolean {
    return this.abortController !== null;
  }

  /**
   * Fetch with streaming support using XMLHttpRequest for Zotero (simplified)
   */
  private async fetchWithZoteroStreamSimple(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body: string;
      onChunk: (chunk: string) => void;
      onComplete: (fullText: string) => void;
      onError: (error: Error) => void;
      signal?: AbortSignal;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Components.interfaces.nsIXMLHttpRequest);

      xhr.open(options.method, url, true);

      // Set headers
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Handle abort
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }

      let lastProcessedLength = 0;
      let fullText = '';

      xhr.onprogress = () => {
        const newData = xhr.responseText.slice(lastProcessedLength);
        lastProcessedLength = xhr.responseText.length;

        if (newData) {
          // Parse SSE chunks
          const lines = newData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                continue;
              }

              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  options.onChunk(content);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          options.onComplete(fullText);
          resolve();
        } else {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          options.onError(error);
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('Network error');
        options.onError(error);
        reject(error);
      };

      xhr.ontimeout = () => {
        const error = new Error('Request timeout');
        options.onError(error);
        reject(error);
      };

      xhr.send(options.body);
    });
  }

  /**
   * Chat with automatic streaming or non-streaming based on options
   */
  async chatAuto(
    messages: ChatMessage[],
    callbacks?: StreamCallbacks
  ): Promise<LLMResponse> {
    if (this.options.enableStreaming && callbacks) {
      let fullContent = '';
      await this.streamChat(messages, {
        onStart: callbacks.onStart,
        onChunk: (chunk) => {
          fullContent += chunk;
          callbacks.onChunk?.(chunk);
        },
        onComplete: callbacks.onComplete,
        onError: callbacks.onError,
      });
      return { content: fullContent };
    } else {
      return this.chat(messages);
    }
  }
}
