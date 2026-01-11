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

export type AIProvider = 'openai' | 'gemini' | 'slm' | 'custom';


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

/**
 * Structured response type for AI Tutor
 * Compatible with both OpenAI and SLM models
 */
export interface SlideContent {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram' | 'summary';
  content: string;
  keyPoints?: string[];
  visualAid?: {
    type: 'mermaid' | 'illustration';
    data: string;
  };
  spokenContent?: string;
}

export interface TutorResponse {
  message: string;
  slides?: SlideContent[];
  notes?: string[];
  needsQuiz?: boolean;
  needsDiagram?: boolean;
  guidanceMessage?: string;
  simplificationLevel?: 'basic' | 'intermediate' | 'advanced';
  success: boolean;
}

// Get AI configuration from environment variables
// PRIORITY: SLM (Hugging Face) is PRIMARY when configured, GPT is fallback only
function getAIConfig(): AIConfig {
  // Check if SLM is configured via HF_API_KEY (Hugging Face Inference API)
  const hfApiKey = process.env.HF_API_KEY;
  const slmModelName = process.env.SLM_MODEL_NAME || process.env.HF_MODEL_NAME;
  
  if (hfApiKey) {
    // SLM via Hugging Face is PRIMARY - use it when configured
    console.log('[AIAdapter] ✓ Using SLM as PRIMARY provider (Hugging Face)');
    console.log('[AIAdapter] Model:', slmModelName || 'meta-llama/Llama-3.2-3B-Instruct');
    return {
      provider: 'slm',
      apiKey: hfApiKey,
      baseUrl: 'https://router.huggingface.co', // Hugging Face Router API (new endpoint)
      model: slmModelName || 'meta-llama/Llama-3.2-3B-Instruct', // Default HF model if not specified
      temperature: 0.7,
      maxTokens: 1000,
    };
  }
  
  // Fallback to OpenAI/Gemini if SLM not configured
  console.warn('[AIAdapter] ⚠️ HF_API_KEY not found - falling back to OpenAI/Gemini');
  console.warn('[AIAdapter] For SLM as PRIMARY, set HF_API_KEY in .env.local');
  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;
  
  switch (provider) {
    case 'openai':
      console.log('[AIAdapter] Using OpenAI as fallback provider');
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.AI_MODEL_NAME || 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000,
      };
    
    case 'gemini':
      // Google Gemini configuration - Use v1 API (stable)
      // Valid models: models/gemini-1.5-pro, models/gemini-1.5-flash
      return {
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || '',
        baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1',
        model: process.env.GEMINI_MODEL_NAME || 'models/gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1000,
      };
    
    case 'slm':
      // SLM configuration (explicit provider selection - supports HF_API_KEY)
      return {
        provider: 'slm',
        apiKey: hfApiKey || process.env.SLM_API_KEY || '',
        baseUrl: process.env.SLM_API_URL || process.env.SLM_BASE_URL || 'https://router.huggingface.co',
        model: slmModelName || process.env.SLM_MODEL_NAME || 'meta-llama/Llama-3.2-3B-Instruct',
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
   * Generate text completion with automatic fallback to Gemini if OpenAI rate limited
   * Model-agnostic interface for chat completions
   */
  async generateCompletion(options: AICompletionOptions, tryGeminiFallback: boolean = true): Promise<AIResponse> {
    try {
      return await this.generateCompletionWithProvider(options, this.config);
    } catch (error: any) {
      // If OpenAI rate limited (429) or quota exceeded and Gemini is available, try fallback
      const isRateLimited = error.message?.includes('429') || 
                           error.message?.includes('rate limit') || 
                           error.message?.includes('Too Many Requests') ||
                           error.message?.includes('insufficient_quota') ||
                           error.message?.includes('quota');
      
      if (tryGeminiFallback && 
          this.config.provider === 'openai' && 
          isRateLimited &&
          process.env.GEMINI_API_KEY && 
          process.env.GEMINI_API_KEY.trim() !== '') {
        console.log('[AIAdapter] OpenAI rate limited/quota exceeded, falling back to Gemini...');
        
        // Validate Gemini key before using
        if (process.env.GEMINI_API_KEY.length < 20) {
          console.error('[AIAdapter] Gemini API key seems invalid (too short). Skipping fallback.');
          throw error;
        }
        
        const geminiConfig: AIConfig = {
          provider: 'gemini',
          apiKey: process.env.GEMINI_API_KEY,
          baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1',
          model: process.env.GEMINI_MODEL_NAME || 'models/gemini-1.5-flash',
          temperature: options.temperature ?? this.config.temperature,
          maxTokens: options.maxTokens ?? this.config.maxTokens,
        };
        return await this.generateCompletionWithProvider(options, geminiConfig, false);
      }
      throw error;
    }
  }

  /**
   * Internal method to generate completion with specific provider
   */
  private async generateCompletionWithProvider(
    options: AICompletionOptions, 
    config: AIConfig,
    tryGeminiFallback: boolean = false
  ): Promise<AIResponse> {
    const { messages, temperature, maxTokens, responseFormat } = options;

    // Handle Gemini provider differently
    if (config.provider === 'gemini') {
      return await this.generateGeminiCompletion(messages, temperature, maxTokens, responseFormat, config);
    }

    // OpenAI-compatible format for other providers (OpenAI, Hugging Face, etc.)
    // Hugging Face Inference API uses the same format as OpenAI
    const requestBody = {
      model: config.model,
      messages,
      temperature: temperature ?? config.temperature,
      max_tokens: maxTokens ?? config.maxTokens,
      ...(responseFormat === 'json' && { response_format: { type: "json_object" } })
    };

    const apiUrl = this.getCompletionEndpoint(config);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`, // Works for both OpenAI and Hugging Face (HF_API_KEY)
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      
      console.error(`[AIAdapter] ${config.provider} API error:`, response.status, errorText);
      console.error(`[AIAdapter] Request URL:`, apiUrl);
      console.error(`[AIAdapter] Model:`, config.model);
      console.error(`[AIAdapter] API Key length:`, config.apiKey?.length || 0);
      
      // Provide helpful error messages for common issues
      if (config.provider === 'slm') {
        if (response.status === 401) {
          throw new Error(`Hugging Face API authentication failed (401). Please check your HF_API_KEY is valid. Get your key from https://huggingface.co/settings/tokens`);
        } else if (response.status === 404) {
          throw new Error(`Hugging Face API endpoint not found (404). Check:\n1. Endpoint: ${apiUrl}\n2. Model name: ${config.model}\n3. HF_API_KEY is set correctly\nError: ${errorText.substring(0, 200)}`);
        } else if (response.status === 503) {
          throw new Error(`Hugging Face model is loading (503). Please wait a moment and try again. Model: ${config.model}`);
        }
      }
      
      throw new Error(`${config.provider.toUpperCase()} API error: ${response.status} ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    return this.normalizeCompletionResponse(data, config);
  }

  /**
   * Generate completion using Google Gemini API
   */
  private async generateGeminiCompletion(
    messages: AIMessage[],
    temperature?: number,
    maxTokens?: number,
    responseFormat?: 'text' | 'json',
    config?: AIConfig
  ): Promise<AIResponse> {
    const geminiConfig = config || {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || '',
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1',
      model: process.env.GEMINI_MODEL_NAME || 'models/gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
    };

    // Validate API key before making requests
    if (!geminiConfig.apiKey || geminiConfig.apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY is missing or empty. Please check your .env.local file and restart the server.');
    }

    // Check API key format (Gemini keys don't have a standard prefix, but should not be empty)
    if (geminiConfig.apiKey.length < 20) {
      console.warn('[AIAdapter] Warning: Gemini API key seems too short. Please verify your key is correct.');
    }

    // Valid Gemini models only
    const GEMINI_MODELS = [
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];

    // Use user-specified model if valid, otherwise use defaults in order
    const userModel = geminiConfig.model;
    const modelsToTry = userModel && GEMINI_MODELS.includes(userModel)
      ? [userModel, ...GEMINI_MODELS.filter(m => m !== userModel)]
      : GEMINI_MODELS;

    // Convert OpenAI message format to Gemini format
    const contents = messages
      .filter(msg => msg.role !== 'system') // Gemini doesn't use system messages the same way
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Add system message as first user message if present
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
      contents.unshift({
        role: 'user',
        parts: [{ text: systemMessage.content }]
      });
    }

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: temperature ?? geminiConfig.temperature ?? 0.7,
        maxOutputTokens: maxTokens ?? geminiConfig.maxTokens ?? 1000,
        ...(responseFormat === 'json' && { responseMimeType: 'application/json' })
      }
    };

    // Try each model, don't throw errors - just try next
    for (const model of modelsToTry) {
      try {
        const apiUrl = `${geminiConfig.baseUrl}/${model}:generateContent?key=${geminiConfig.apiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Log successful model if different from default
          if (model !== modelsToTry[0]) {
            console.log(`[AIAdapter] Gemini: Using fallback model ${model}`);
          }
          
          // Normalize Gemini response to our format
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          return {
            content: text,
            usage: data.usageMetadata ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              completionTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0,
            } : undefined,
          };
        }

        // If not OK, log and try next model (don't throw)
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Unable to read error response';
        }
        
        // Provide detailed error information for 401 (auth errors)
        if (response.status === 401) {
          console.error(`[AIAdapter] Gemini API Authentication Failed (401) for model ${model}`);
          console.error(`[AIAdapter] Check your GEMINI_API_KEY in .env.local. Key length: ${geminiConfig.apiKey.length} chars`);
          console.error(`[AIAdapter] Key starts with: ${geminiConfig.apiKey.substring(0, Math.min(10, geminiConfig.apiKey.length))}...`);
          // Don't continue for auth errors - they'll all fail
          throw new Error(`Gemini API authentication failed (401). Please check your GEMINI_API_KEY is valid. Make sure:\n1. Key is in .env.local\n2. Server was restarted after adding key\n3. No spaces or quotes around the key\nError: ${errorText.substring(0, 200)}`);
        }
        
        console.log(`[AIAdapter] Gemini model ${model} failed: ${response.status} - ${errorText.substring(0, 100)}`);
        continue;
      } catch (error: any) {
        // Log error and try next model (don't throw)
        console.log(`[AIAdapter] Gemini model ${model} error:`, error.message || error);
        continue;
      }
    }

    // If all models failed, throw clear error with helpful message
    throw new Error(
      `All Gemini models failed. Please verify:\n` +
      `1. GEMINI_API_KEY is set in .env.local\n` +
      `2. The API key is valid (get one from https://aistudio.google.com/app/apikey)\n` +
      `3. Server was restarted after adding the key\n` +
      `4. No typos or extra spaces in the key`
    );
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
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[AIAdapter] STT API error: ${response.status}`, errorText);
        
        if (response.status === 401) {
          throw new Error('STT API key is invalid or unauthorized. Please check your OPENAI_API_KEY.');
        } else if (response.status === 429) {
          throw new Error('STT API rate limited. Please wait and try again.');
        }
        throw new Error(`STT API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error: any) {
      console.error('[AIAdapter] STT error:', error);
      // Preserve original error message if it's already informative
      if (error.message && error.message.includes('STT API')) {
        throw error;
      }
      throw new Error(error.message || 'Failed to transcribe audio');
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

  private getCompletionEndpoint(config?: AIConfig): string {
    const cfg = config || this.config;
    switch (cfg.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'gemini':
        return `${cfg.baseUrl}/models/${cfg.model}:generateContent`;
      case 'slm':
        // Hugging Face Router API uses /v1/chat/completions endpoint (OpenAI-compatible)
        return `${cfg.baseUrl}/v1/chat/completions`;
      case 'custom':
        return `${cfg.baseUrl}/chat/completions`;
      default:
        throw new Error(`Unknown AI provider: ${cfg.provider}`);
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

  private normalizeCompletionResponse(data: any, config?: AIConfig): AIResponse {
    const cfg = config || this.config;
    
    // Handle Gemini response format
    if (cfg.provider === 'gemini') {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        content: text,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    }
    
    // OpenAI-compatible format (OpenAI, Hugging Face/SLM, etc.)
    // Hugging Face Inference API returns the same format as OpenAI (with choices array)
    if (cfg.provider === 'openai' || cfg.provider === 'slm' || data.choices) {
      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
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
// PRIORITY: SLM (Hugging Face) is PRIMARY when configured
export function isAIConfigured(): boolean {
  // Check if SLM is configured via HF_API_KEY first (SLM is PRIMARY)
  const hfApiKey = process.env.HF_API_KEY;
  if (hfApiKey) {
    return true; // SLM via Hugging Face is configured - PRIMARY provider
  }
  
  // Fallback to OpenAI/Gemini if SLM not configured
  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider === 'openai') {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
  } else if (provider === 'gemini') {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';
  }
  
  const config = getAIConfig();
  return !!config.apiKey && config.apiKey !== 'sk-your-openai-api-key-here';
}

// Check if Gemini is available as fallback
export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';
}