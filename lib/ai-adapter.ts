/**
 * AI Adapter Layer - Model Agnostic Interface
 * 
 * This adapter abstracts all AI operations to be model-agnostic.
 * Currently uses OpenAI for development/testing, but designed for easy
 * switching to SLM (Small Language Model) in production.
 * 
 * To switch models, only change:
 * - AI_PROVIDER
 * - AI_BASE_URL
 * - AI_API_KEY
 * - AI_MODEL_NAME
 */

export type AIProvider = 'openai' | 'slm' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIAudioOptions {
  text: string;
  voice?: string;
  speed?: number;
}

export interface AITranscriptionOptions {
  audio: Blob;
  language?: string;
}

// Get AI configuration from environment variables
function getAIConfig(): AIConfig {
  // TEMPORARY: Using OpenAI for development
  // TODO: Replace with SLM configuration in production
  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;
  
  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.AI_MODEL_NAME || 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000,
      };
    
    case 'slm':
      // SLM configuration - ready for production
      return {
        provider: 'slm',
        apiKey: process.env.SLM_API_KEY || '',
        baseUrl: process.env.SLM_BASE_URL || 'http://localhost:8080/v1',
        model: process.env.SLM_MODEL_NAME || 'llama-3-8b',
        temperature: 0.7,
        maxTokens: 1000,
      };
    
    default:
      // Custom provider configuration
      return {
        provider: 'custom',
        apiKey: process.env.AI_API_KEY || '',
        baseUrl: process.env.AI_BASE_URL || '',
        model: process.env.AI_MODEL_NAME || '',
        temperature: 0.7,
        maxTokens: 1000,
      };
  }
}

/**
 * AIAdapter - Main class for all AI operations
 */
export class AIAdapter {
  private config: AIConfig;

  constructor(config?: AIConfig) {
    this.config = config || getAIConfig();
  }

  /**
   * Generate text completion
   * Model-agnostic interface for chat completions
   */
  async generateCompletion(options: AICompletionOptions): Promise<AIResponse> {
    const { messages, temperature, maxTokens, responseFormat } = options;

    // Common request structure (OpenAI-compatible format)
    const requestBody = {
      model: this.config.model,
      messages,
      temperature: temperature ?? this.config.temperature,
      max_tokens: maxTokens ?? this.config.maxTokens,
      ...(responseFormat === 'json' && { response_format: { type: "json_object" } })
    };

    try {
      // Determine API endpoint based on provider
      const apiUrl = this.getCompletionEndpoint();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Normalize response format across providers
      return this.normalizeCompletionResponse(data);
    } catch (error) {
      console.error('[AIAdapter] Completion error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate text-to-speech audio
   * Model-agnostic TTS interface
   */
  async generateSpeech(options: AIAudioOptions): Promise<Blob> {
    const { text, voice = 'alloy', speed = 1.0 } = options;

    try {
      const apiUrl = this.getTTSEndpoint();
      
      // Common TTS request structure
      const requestBody = {
        model: this.config.provider === 'openai' ? 'tts-1' : 'tts',
        input: text,
        voice,
        speed,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('[AIAdapter] TTS error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Transcribe audio to text
   * Model-agnostic STT interface
   */
  async transcribeAudio(options: AITranscriptionOptions): Promise<string> {
    const { audio, language = 'en' } = options;

    try {
      const apiUrl = this.getSTTEndpoint();
      
      const formData = new FormData();
      formData.append('file', audio, 'audio.webm');
      formData.append('model', this.config.provider === 'openai' ? 'whisper-1' : 'whisper');
      formData.append('language', language);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('[AIAdapter] STT error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Analyze image for emotion detection
   * Model-agnostic vision API interface
   */
  async analyzeImage(imageData: string, prompt: string): Promise<string> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'user',
          content: prompt,
        }
      ];

      // For vision models, we need to include the image in the message
      if (this.config.provider === 'openai') {
        messages[0].content = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageData } }
        ] as any;
      }

      const response = await this.generateCompletion({
        messages,
        temperature: 0.3, // Lower temperature for analysis tasks
        maxTokens: 150,
      });

      return response.content;
    } catch (error) {
      console.error('[AIAdapter] Vision analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  // Private helper methods

  private getCompletionEndpoint(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'slm':
      case 'custom':
        return `${this.config.baseUrl}/chat/completions`;
      default:
        throw new Error(`Unknown AI provider: ${this.config.provider}`);
    }
  }

  private getTTSEndpoint(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/audio/speech';
      case 'slm':
      case 'custom':
        return `${this.config.baseUrl}/audio/speech`;
      default:
        throw new Error(`Unknown AI provider: ${this.config.provider}`);
    }
  }

  private getSTTEndpoint(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/audio/transcriptions';
      case 'slm':
      case 'custom':
        return `${this.config.baseUrl}/audio/transcriptions`;
      default:
        throw new Error(`Unknown AI provider: ${this.config.provider}`);
    }
  }

  private normalizeCompletionResponse(data: any): AIResponse {
    // Normalize response format across different providers
    // Most providers follow OpenAI's format, but this ensures compatibility
    
    if (this.config.provider === 'openai' || !data.choices) {
      // OpenAI format
      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    }
    
    // Generic format for other providers
    return {
      content: data.choices?.[0]?.message?.content || data.response || data.text || '',
      usage: data.usage,
    };
  }

  /**
   * Get current provider info
   */
  getProviderInfo(): { provider: AIProvider; model: string; isTemporary: boolean } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      // Mark OpenAI as temporary for development
      isTemporary: this.config.provider === 'openai',
    };
  }
}

// Export singleton instance for convenience
export const aiAdapter = new AIAdapter();

// Export helper function to check if AI is properly configured
export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!config.apiKey && config.apiKey !== 'sk-your-openai-api-key-here';
}