/**
 * ==========================================================
 * API SERVICE - SOLID PRINCIPLES IMPLEMENTATION
 * ==========================================================
 * 
 * Single Responsibility: Each service handles one API provider
 * Open/Closed: Easy to add new providers without modifying existing code
 * Liskov Substitution: All services implement same interface
 * Interface Segregation: Clean, focused interfaces
 * Dependency Inversion: Depend on abstractions (interfaces)
 * 
 * Benefits:
 * - Centralized API call logic
 * - Built-in rate limiting
 * - Request deduplication
 * - Error handling with retry logic
 * - Easy testing and mocking
 * ==========================================================
 */

import {
  shouldRateLimit,
  trackRequestStart,
  trackRequestComplete,
  generateRequestKey,
  withExponentialBackoff,
} from '../api-rate-limiter';

// Base interface for all API services
export interface APIService {
  call<T>(endpoint: string, options: RequestInit, data?: any): Promise<T>;
  getProviderName(): string;
}

// Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  retryAfterMs?: number;
}

/**
 * Base API Service with rate limiting and error handling
 */
abstract class BaseAPIService implements APIService {
  protected abstract providerName: string;
  protected abstract baseUrl: string;

  getProviderName(): string {
    return this.providerName;
  }

  /**
   * Make API call with rate limiting and retry logic
   */
  async call<T>(
    endpoint: string,
    options: RequestInit = {},
    data?: any
  ): Promise<T> {
    const requestKey = generateRequestKey(this.providerName, data || endpoint);
    
    // Check rate limits
    const rateLimitCheck = shouldRateLimit(this.providerName, requestKey);
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limited: ${rateLimitCheck.reason}. Retry after ${rateLimitCheck.retryAfterMs}ms`
      );
    }

    // Track request start
    trackRequestStart(this.providerName, requestKey);

    try {
      // Execute with exponential backoff
      const response = await withExponentialBackoff(async () => {
        const url = `${this.baseUrl}${endpoint}`;
        const res = await fetch(url, {
          ...options,
          headers: {
            ...this.getDefaultHeaders(),
            ...options.headers,
          },
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          throw new Error(`${this.providerName} API error (${res.status}): ${errorText}`);
        }

        return res;
      });

      // Parse response
      const contentType = response.headers.get('content-type');
      let result: T;
      
      if (contentType?.includes('application/json')) {
        result = await response.json();
      } else if (contentType?.includes('audio')) {
        result = (await response.blob()) as unknown as T;
      } else {
        result = (await response.text()) as unknown as T;
      }

      return result;
    } finally {
      // Track request completion
      trackRequestComplete(requestKey);
    }
  }

  /**
   * Get default headers for this provider
   */
  protected abstract getDefaultHeaders(): Record<string, string>;
}

/**
 * Hugging Face API Service
 */
export class HuggingFaceService extends BaseAPIService {
  protected providerName = 'huggingface';
  protected baseUrl = 'https://router.huggingface.co';

  constructor(private apiKey: string) {
    super();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateCompletion(messages: any[], options: any = {}): Promise<any> {
    return this.call('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: options.model || 'meta-llama/Llama-3.2-3B-Instruct',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    }, messages);
  }
}

/**
 * ElevenLabs API Service
 */
export class ElevenLabsService extends BaseAPIService {
  protected providerName = 'elevenlabs';
  protected baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(private apiKey: string, private voiceId: string = '21m00Tcm4TlvDq8ikWAM') {
    super();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    };
  }

  async textToSpeech(text: string): Promise<Blob> {
    return this.call<Blob>(`/text-to-speech/${this.voiceId}`, {
      method: 'POST',
      body: JSON.stringify({
        text: text.substring(0, 5000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }, text);
  }
}

/**
 * Deepgram API Service
 */
export class DeepgramService extends BaseAPIService {
  protected providerName = 'deepgram';
  protected baseUrl = 'https://api.deepgram.com/v1';

  constructor(private apiKey: string) {
    super();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Authorization': `Token ${this.apiKey}`,
    };
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await this.call<any>('/listen', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    }, audioBlob);

    return response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  }
}

/**
 * OpenAI API Service
 */
export class OpenAIService extends BaseAPIService {
  protected providerName = 'openai';
  protected baseUrl = 'https://api.openai.com/v1';

  constructor(private apiKey: string) {
    super();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateCompletion(messages: any[], options: any = {}): Promise<any> {
    return this.call('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    }, messages);
  }

  async textToSpeech(text: string): Promise<Blob> {
    return this.call<Blob>('/audio/speech', {
      method: 'POST',
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        speed: 1.0,
      }),
    }, text);
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await this.call<any>('/audio/transcriptions', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    }, audioBlob);

    return response.text || '';
  }
}

/**
 * Service Factory - creates appropriate service based on configuration
 */
export class APIServiceFactory {
  static createTTSService(): ElevenLabsService | OpenAIService | null {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const isUsingSLM = !!process.env.HF_API_KEY;

    // Priority 1: ElevenLabs when using SLM
    if (isUsingSLM && elevenLabsKey) {
      return new ElevenLabsService(elevenLabsKey);
    }

    // Priority 2: ElevenLabs if available
    if (elevenLabsKey) {
      return new ElevenLabsService(elevenLabsKey);
    }

    // Priority 3: OpenAI fallback
    if (openaiKey) {
      return new OpenAIService(openaiKey);
    }

    return null;
  }

  static createSTTService(): DeepgramService | OpenAIService | null {
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const isUsingSLM = !!process.env.HF_API_KEY;

    // Priority 1: Deepgram when using SLM
    if (isUsingSLM && deepgramKey) {
      return new DeepgramService(deepgramKey);
    }

    // Priority 2: Deepgram if available
    if (deepgramKey) {
      return new DeepgramService(deepgramKey);
    }

    // Priority 3: OpenAI fallback
    if (openaiKey) {
      return new OpenAIService(openaiKey);
    }

    return null;
  }

  static createAIService(): HuggingFaceService | OpenAIService | null {
    const hfKey = process.env.HF_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Priority 1: Hugging Face (SLM)
    if (hfKey) {
      return new HuggingFaceService(hfKey);
    }

    // Priority 2: OpenAI fallback
    if (openaiKey) {
      return new OpenAIService(openaiKey);
    }

    return null;
  }
}
