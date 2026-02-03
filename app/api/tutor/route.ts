/**
 * ==========================================================
 * TUTOR API ROUTE - SLM-FIRST DESIGN (Hugging Face)
 * ==========================================================
 * 
 * PRIORITY: SLM via Hugging Face is PRIMARY when configured
 * - If HF_API_KEY is set → Uses Hugging Face Inference API (SLM)
 * - Otherwise → Falls back to OpenAI/Gemini
 * 
 * SLM Configuration (Primary - Hugging Face):
 * - Set HF_API_KEY in .env (Hugging Face API key)
 * - Optionally set SLM_MODEL_NAME or HF_MODEL_NAME (default: meta-llama/Llama-3.2-3B-Instruct)
 * - SLM will be used automatically via Hugging Face Inference API
 * 
 * Emotion-Based Adaptation:
 * - When emotion is confused/frustrated → SLM called with simplified prompts
 * - System automatically adjusts explanation complexity based on emotion
 * - Same concept, easier format when user is struggling
 * 
 * Fallback Configuration:
 * - OPENAI_API_KEY for GPT fallback
 * - GEMINI_API_KEY for Gemini fallback
 * 
 * Response Structure:
 * - message: Main explanation text (used for voice/TTS)
 * - slides: Array of learning slides with structured content (title, steps, voice text)
 * - notes: Key points extracted from response
 * 
 * ==========================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAdapter, type AIMessage } from '@/lib/ai-adapter';
import { getTutorSystemPrompt } from '@/lib/tutor-prompts';
import { EmotionType } from '@/lib/utils';
import { analyzeEmotionAndAdapt, enhancePromptForEmotion } from '@/lib/adaptive-response';

interface GeneratedSlide {
  id: string;
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram' | 'summary';
  content: string;
  keyPoints?: string[];
  example?: string;
  visualAid?: {
    type: 'mermaid' | 'illustration' | 'flowchart';
    data: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  isSimplified?: boolean;
  simplificationLevel?: 'basic' | 'intermediate' | 'advanced';
  // Audio sync timing
  audioStartTime?: number; // Seconds into audio when this slide should appear
  audioDuration?: number;  // How long this slide content takes to explain
  spokenContent?: string;  // The portion of audio that corresponds to this slide
}

// Check if AI is configured (SLM via Hugging Face is PRIMARY, GPT/Gemini are fallback)
const isAIConfigured = () => {
  // PRIORITY 1: Check if SLM is configured via HF_API_KEY (SLM is PRIMARY)
  const hfApiKey = process.env.HF_API_KEY;
  if (hfApiKey) {
    return true; // SLM via Hugging Face is configured - use it as PRIMARY
  }
  
  // PRIORITY 2: Fallback to OpenAI/Gemini if SLM not configured
  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider === 'openai') {
    return (!!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') ||
           !!process.env.GEMINI_API_KEY; // Allow Gemini as fallback
  } else if (provider === 'gemini') {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';
  } else if (provider === 'slm') {
    // Explicit SLM provider check (supports HF_API_KEY)
    return !!hfApiKey || (!!process.env.SLM_API_KEY && (!!process.env.SLM_API_URL || !!process.env.SLM_BASE_URL));
  }
  return !!process.env.AI_API_KEY;
};

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration (works for both OpenAI and SLM)
    if (!isAIConfigured()) {
      const provider = process.env.AI_PROVIDER || 'openai';
      return NextResponse.json(
        { 
          error: `AI service not configured. Please configure ${provider.toUpperCase()} API credentials.`,
          code: 'API_KEY_MISSING'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      message, 
      topic = 'general', 
      topicDescription = '',
      topicCategory = 'General',
      isCustomTopic = false,
      learningGoals = [],
      difficulty = 'intermediate',
      emotion = 'neutral', 
      emotionConfidence = 0.5, 
      history = [],
      courseContext = undefined // Lecture context from course page
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Detect user's slide content preference
    const detectSlidePreference = (userMessage: string): string => {
      const msg = userMessage.toLowerCase();
      if (msg.includes('example') || msg.includes('examples')) return 'example';
      if (msg.includes('step by step') || msg.includes('step-by-step')) return 'steps';
      if (msg.includes('diagram') || msg.includes('visual') || msg.includes('chart')) return 'diagram';
      if (msg.includes('practice') || msg.includes('quiz') || msg.includes('test')) return 'practice';
      if (msg.includes('simple') || msg.includes('beginner') || msg.includes('basic')) return 'simple';
      return 'general';
    };

    const slidePreference = detectSlidePreference(message);
    console.log('[Tutor] Slide preference detected:', slidePreference);

    // Analyze emotion and determine if simplification is needed
    // EMOTION-BASED ADAPTATION: When confused/frustrated, SLM is called again with simpler prompts
    // This changes HOW content is explained, NOT the lecture order
    const adaptiveResponse = analyzeEmotionAndAdapt(
      emotion as EmotionType,
      emotionConfidence,
      message
    );

    // Get base system prompt
    let systemPrompt = getTutorSystemPrompt(emotion as EmotionType, topic);
    
    // Log emotion-based adaptation for debugging
    if (adaptiveResponse.shouldRegenerateSimplified) {
      console.log(`[Tutor API] 🔄 Emotion-based re-explanation triggered: ${emotion} (confidence: ${emotionConfidence})`);
      console.log(`[Tutor API] Simplification level: ${adaptiveResponse.simplificationLevel}`);
    }
    
    // PRIORITY: Enhance prompt with COURSE LECTURE CONTEXT if available
    if (courseContext && courseContext.lectureTitle) {
      systemPrompt += `\n\n=== COURSE LECTURE CONTEXT (HIGH PRIORITY) ===
The student is currently learning from a specific course lecture:
- Lecture Title: ${courseContext.lectureTitle}
${courseContext.lectureDescription ? `- Lecture Description: ${courseContext.lectureDescription}` : ''}

CRITICAL INSTRUCTIONS (BACKEND FOCUS):
1. Your responses MUST be directly related to THIS SPECIFIC LECTURE content
2. Focus on backend logic, code examples, and debugging help
3. Provide working code snippets related to this lecture topic
4. Explain WHY the code works, not just WHAT it does
5. Help debug if something fails in their implementation
6. Use the lecture description to understand what backend concepts are being taught
7. Do NOT generate slides, UI, or design content

The student came here for help understanding THIS LECTURE's backend concepts. Act as a backend tutor, not a designer.`;
    }
    
    // Enhance prompt for custom topics (if not from course)
    if (!courseContext && isCustomTopic && topicDescription) {
      systemPrompt += `\n\n=== CUSTOM TOPIC CONTEXT ===
Topic: ${topic}
Category: ${topicCategory}
Description: ${topicDescription}
Difficulty Level: ${difficulty}
${learningGoals.length > 0 ? `Learning Goals:\n${learningGoals.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}` : ''}

IMPORTANT: This is a custom learning topic. Focus your teaching on the description and learning goals provided. Adapt your explanations to the specified difficulty level (${difficulty}).`;
    }
    
    // Enhance prompt based on emotion and confidence (EMOTION-BASED ADAPTATION)
    // When emotion is confused/frustrated, SLM will be called again with simpler prompts
    if (adaptiveResponse.additionalPrompt) {
      systemPrompt = enhancePromptForEmotion(systemPrompt, emotion as EmotionType, emotionConfidence, message);
    }

    // Build conversation history (model-agnostic format)
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Adjust temperature based on emotion
    const temperature = emotion === 'confused' || emotion === 'frustrated' ? 0.5 : 0.7;

    // Call AI service through adapter (works with both OpenAI and SLM)
    const aiResponse = await aiAdapter.generateCompletion({
      messages,
      temperature,
      maxTokens: adaptiveResponse.simplificationLevel === 'basic' ? 800 : 1000,
    });

    const responseMessage = aiResponse.content || '';

    // Extract notes (key points) from response
    const notes = extractKeyPoints(responseMessage);

    // ============================================================
    // CRITICAL: Generate slides FROM SLM response (NO additional SLM call)
    // ============================================================
    // The SLM already returned structured content (Title, Explanation, Analogy, Code, etc.)
    // We just parse it into slide format for the UI
    // This ensures slides show ONLY what SLM said, nothing random or static
    const slides = extractSlidesFromSLMResponse(
      responseMessage,
      topic,
      adaptiveResponse.simplificationLevel,
      emotion as EmotionType,
      slidePreference
    );
    
    console.log(`[Tutor API] ✓ Generated ${slides.length} slides from SLM response`);

    // Check if user might need simplified content
    const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.6;
    
    // Generate guidance message for confused users
    let guidanceMessage = '';
    if (needsSimplification) {
      guidanceMessage = emotion === 'confused'
        ? "I notice you might be finding this tricky. Let me explain this concept in a simpler way with a clearer code example."
        : "This can be challenging. Let me break down the backend logic step by step.";
    }

    return NextResponse.json({
      message: responseMessage, // Full SLM response (used for TTS voice text)
      notes: notes,
      needsQuiz: false,
      needsDiagram: slides.some(s => s.visualAid?.type === 'mermaid'),
      slides: slides, // Slides extracted from SLM response
      needsSimplification: needsSimplification,
      guidanceMessage: guidanceMessage,
      simplificationLevel: adaptiveResponse.simplificationLevel,
      success: true,
    });
  } catch (error: any) {
    console.error('Tutor API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tutor response' },
      { status: 500 }
    );
  }
}

// Extract slides from SLM structured response
// Robust parser that handles multiple response formats from different SLMs
function extractSlidesFromSLMResponse(
  response: string,
  topic: string,
  simplificationLevel: 'basic' | 'intermediate' | 'advanced',
  emotion: EmotionType,
  slidePreference: string = 'general'
): GeneratedSlide[] {
  const slides: GeneratedSlide[] = [];
  const isSimplified = simplificationLevel === 'basic';
  const responseText = response.trim();
  
  console.log('[SlideExtractor] Parsing response, length:', responseText.length);
  
  // ============================================================
  // STEP 1: Extract Title (multiple format support)
  // ============================================================
  let title = topic;
  
  // Try markdown headers first: # Title or ## Title
  const headerMatch = responseText.match(/^#+\s*\*?\*?(.+?)\*?\*?\s*$/m);
  if (headerMatch) {
    title = headerMatch[1].replace(/\*\*/g, '').trim();
  } else {
    // Try bold title: **Title** or **Title:**
    const boldMatch = responseText.match(/^\*\*([^*]+?)\*\*:?\s*$/m);
    if (boldMatch) {
      title = boldMatch[1].trim();
    }
  }
  
  // Clean up title
  title = title.replace(/^(Title|Topic)[:.]?\s*/i, '').trim() || topic;
  
  // ============================================================
  // STEP 2: Extract Main Explanation/Content
  // ============================================================
  let mainExplanation = '';
  
  // Try structured format: **Short Explanation:** or **Explanation:**
  const structuredExplanation = responseText.match(/\*\*(?:Short\s+)?Explanation\*\*:?\s*\n?([\s\S]+?)(?=\n\*\*|\n##|```|$)/i);
  if (structuredExplanation) {
    mainExplanation = structuredExplanation[1].trim();
  } else {
    // Try to get first paragraph after title
    const firstParagraph = responseText.match(/(?:^|\n\n)([^#*`\n][^\n]+(?:\n[^#*`\n][^\n]+)*)/);
    if (firstParagraph) {
      mainExplanation = firstParagraph[1].trim();
    } else {
      // Fallback: first 300 chars
      mainExplanation = responseText.replace(/^[#*]+.*\n/m, '').substring(0, 300).trim();
    }
  }
  
  // Create main concept slide
  if (mainExplanation) {
    slides.push({
      id: `slide-concept-${Date.now()}`,
      title: title,
      type: 'concept',
      content: mainExplanation.substring(0, 500),
      keyPoints: extractKeyPoints(mainExplanation).slice(0, isSimplified ? 2 : 4),
      isSimplified,
      simplificationLevel,
      spokenContent: mainExplanation
    });
  }
  
  // ============================================================
  // STEP 3: Extract Analogy (multiple formats)
  // ============================================================
  const analogyPatterns = [
    /\*\*(?:Real-?\s*World\s+)?Analogy\*\*:?\s*\n?([\s\S]+?)(?=\n\*\*|\n##|```|$)/i,
    /(?:Think of it (?:like|as)|Imagine|It's like|Consider)\s+([^.]+\.)/i,
    /Analogy:?\s*\n?([\s\S]+?)(?=\n\*\*|\n##|```|$)/i
  ];
  
  for (const pattern of analogyPatterns) {
    const analogyMatch = responseText.match(pattern);
    if (analogyMatch && analogyMatch[1].trim().length > 20) {
      const analogy = analogyMatch[1].trim();
      slides.push({
        id: `slide-analogy-${Date.now()}`,
        title: '💡 Real-World Analogy',
        type: 'example',
        content: analogy,
        keyPoints: [analogy.length > 100 ? analogy.substring(0, 97) + '...' : analogy],
        isSimplified,
        simplificationLevel,
        spokenContent: analogy
      });
      break;
    }
  }
  
  // ============================================================
  // STEP 4: Extract Code Examples (robust multi-language support)
  // ============================================================
  const codeBlockPattern = /```(?:javascript|js|typescript|ts|python|py|java|cpp|c\+\+|json|sql|bash|sh)?\s*\n([\s\S]+?)```/g;
  let codeMatch;
  let codeSlideCount = 0;
  
  while ((codeMatch = codeBlockPattern.exec(responseText)) !== null && codeSlideCount < 2) {
    const code = codeMatch[1].trim();
    if (code.length > 20) {
      // Try to find description before code block
      const codeIndex = codeMatch.index;
      const textBefore = responseText.substring(Math.max(0, codeIndex - 200), codeIndex);
      const descMatch = textBefore.match(/(?:\*\*[^*]+\*\*:?|[^\n]+)\s*$/m);
      const codeDescription = descMatch 
        ? descMatch[0].replace(/\*\*/g, '').trim() 
        : 'Working Code Example';
      
      const formattedCode = formatCodeForDisplay(code);
      const codeSections = extractCodeSections(code);
      
      slides.push({
        id: `slide-code-${Date.now()}-${codeSlideCount}`,
        title: codeSlideCount === 0 ? '💻 Code Example' : '💻 Additional Example',
        type: 'example',
        content: codeDescription.substring(0, 150),
        example: formattedCode,
        keyPoints: [
          '✅ Complete, runnable code',
          ...codeSections.slice(0, 3)
        ],
        visualAid: codeSlideCount === 0 ? generateCodeFlowDiagram(code) : undefined,
        isSimplified,
        simplificationLevel,
        spokenContent: formatCodeForSpokenContent(code)
      });
      codeSlideCount++;
    }
  }
  
  // ============================================================
  // STEP 5: Extract Tips/Mistakes/Best Practices
  // ============================================================
  const tipPatterns = [
    /\*\*(?:Common\s+)?Mistake\*\*:?\s*\n?([\s\S]+?)(?=\n\*\*|\n##|```|$)/i,
    /\*\*(?:Pro\s+)?Tips?\*\*:?\s*\n?([\s\S]+?)(?=\n\*\*|\n##|```|$)/i,
    /\*\*Best\s+Practices?\*\*:?\s*\n?([\s\S]+?)(?=\n\*\*|\n##|```|$)/i,
    /(?:Remember|Important|Note|Tip):?\s*([^\n]+)/i
  ];
  
  for (const pattern of tipPatterns) {
    const tipMatch = responseText.match(pattern);
    if (tipMatch && tipMatch[1].trim().length > 15) {
      const tip = tipMatch[1].trim();
      slides.push({
        id: `slide-tip-${Date.now()}`,
        title: '⚠️ Important Tips',
        type: 'tip',
        content: tip.substring(0, 400),
        keyPoints: extractKeyPoints(tip).slice(0, 3),
        isSimplified,
        simplificationLevel,
        spokenContent: tip
      });
      break;
    }
  }
  
  // ============================================================
  // STEP 6: Extract bullet points/list items as summary
  // ============================================================
  const bulletPoints = responseText.match(/^[\-\*•]\s+.+$/gm);
  const numberedPoints = responseText.match(/^\d+\.\s+.+$/gm);
  const allPoints = [...(bulletPoints || []), ...(numberedPoints || [])];
  
  if (allPoints.length >= 3 && slides.length < 4) {
    slides.push({
      id: `slide-summary-${Date.now()}`,
      title: '📝 Key Points',
      type: 'summary',
      content: 'Here are the key takeaways:',
      keyPoints: allPoints.slice(0, 5).map(p => p.replace(/^[\-\*•\d.]+\s*/, '').trim()),
      isSimplified,
      simplificationLevel,
      spokenContent: allPoints.slice(0, 5).join('. ')
    });
  }
  
  // ============================================================
  // FALLBACK: If extraction failed, create slides from paragraphs
  // ============================================================
  if (slides.length === 0) {
    console.log('[SlideExtractor] No structured content found, using paragraph fallback');
    return generateFallbackSlides(responseText, topic, isSimplified);
  }
  
  console.log(`[SlideExtractor] ✅ Extracted ${slides.length} slides`);
  return slides;
}

// Extract key points/notes from tutor response
function extractKeyPoints(text: string): string[] {
  const notes: string[] = [];
  
  // Look for bullet points
  const bulletRegex = /^[•\-*]\s+(.+)$/gm;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    notes.push(match[1].trim());
  }
  
  // Look for numbered points
  const numberedRegex = /^\d+\.\s+(.+)$/gm;
  while ((match = numberedRegex.exec(text)) !== null) {
    notes.push(match[1].trim());
  }
  
  // If no structured points found, extract sentences with key terms
  if (notes.length === 0) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyTerms = ['remember', 'important', 'key', 'note', 'concept', 'principle'];
    
    sentences.forEach(sentence => {
      if (keyTerms.some(term => sentence.toLowerCase().includes(term))) {
        notes.push(sentence.trim());
      }
    });
  }
  
  // Limit to 5 key points
  return notes.slice(0, 5);
}

// Generate learning slides based on tutor response with audio sync and diagrams
async function generateLearningSlides(
  tutorResponse: string,
  topic: string,
  simplificationLevel: 'basic' | 'intermediate' | 'advanced',
  emotion: EmotionType,
  emotionConfidence: number,
  slidePreference: string = 'general'
): Promise<GeneratedSlide[]> {
  const isSimplified = simplificationLevel === 'basic';
  const needsSimplification = (emotion === 'confused' || emotion === 'frustrated') && emotionConfidence > 0.5;

  // Calculate approximate word count and timing
  const wordCount = tutorResponse.split(/\s+/).length;
  const wordsPerMinute = 150; // Average TTS speed
  const totalDuration = (wordCount / wordsPerMinute) * 60; // Total seconds
  const slideCount = Math.min(Math.max(Math.ceil(wordCount / 100), 2), 5); // 2-5 slides based on content
  const avgSlideDuration = totalDuration / slideCount;

  try {
    const slidePrompt = needsSimplification
      ? `Generate EXTREMELY SIMPLIFIED learning slides with diagrams. The student is ${emotion}.
         Use: super simple language, everyday analogies, short sentences, encouraging tone.
         Include simple flowchart diagrams using Mermaid syntax.`
      : `Generate clear, educational learning slides with visual diagrams for the topic.`;

    // Customize slide generation based on user preference
    const getPreferencePrompt = (pref: string): string => {
      switch (pref) {
        case 'example':
          return 'Focus heavily on practical examples and real-world applications. Include at least 2 concrete examples with code.';
        case 'steps':
          return 'Break down everything into clear, numbered steps. Use step-by-step format for all explanations.';
        case 'diagram':
          return 'Emphasize visual learning with detailed diagrams and flowcharts. Include multiple visual aids.';
        case 'practice':
          return 'Include practice problems and interactive exercises. Focus on hands-on learning.';
        case 'simple':
          return 'Use extremely simple language. Avoid jargon. Use everyday analogies.';
        default:
          return 'Provide balanced, comprehensive content.';
      }
    };

    // Use AI Adapter for slide generation (model-agnostic)
    const completion = await aiAdapter.generateCompletion({
      messages: [
        {
          role: 'system',
          content: `You are an educational slide generator that creates synchronized learning content. ${slidePrompt}
          
User requested: ${getPreferencePrompt(slidePreference)}

Create ${slideCount} slides that correspond to different parts of the tutor's explanation.
Return ONLY a JSON object with a "slides" array.

Each slide MUST have:
- id: unique string like "slide-1", "slide-2"
- title: clear, descriptive title
- type: one of [concept, example, tip, diagram, summary, practice]
- content: ${isSimplified ? '1-2 simple sentences' : '2-3 sentences'} matching the audio explanation
- keyPoints: array of ${isSimplified ? '2-3 very simple points' : '3-4 key points'}
- example: (REQUIRED for example/practice types) properly formatted code with:
  * Use \`\`\`javascript or \`\`\`python code blocks
  * Include clear comments explaining each line
  * Show complete, runnable examples
  * Use proper indentation (2 spaces)
  * Add console.log or print statements to show output
- spokenContent: the EXACT portion of the tutor response this slide covers (for audio sync)
- visualAid: { type: "mermaid", data: "<mermaid diagram code>" } - OPTIONAL for concept and diagram types

CRITICAL CODE FORMATTING RULES:
1. All code MUST be in proper markdown code blocks with language specified
2. Code must be complete and runnable (include imports, setup)
3. Add inline comments explaining each important line
4. Use consistent indentation (2 spaces)
5. Include example output in comments
6. Structure code with clear sections (setup, main logic, examples)

Example of properly formatted code:
\`\`\`javascript
// ===== SETUP =====
const express = require('express');
const app = express();

// ===== MIDDLEWARE =====
// This middleware runs before every request
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next(); // Pass control to next middleware
});

// ===== ROUTE =====
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// ===== START SERVER =====
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
// Output: Server running on port 3000
\`\`\`

For visualAid diagrams, use simple Mermaid syntax like:
- Flowcharts: graph TD\n  A[Step 1] --> B[Step 2]
- Sequences: sequenceDiagram\n  A->>B: message
- Simple graphs work best. Avoid complex syntax.

IMPORTANT: The "spokenContent" field should contain the actual words from the tutor response that this slide illustrates.`
        },
        {
          role: 'user',
          content: `Topic: ${topic}

Tutor Response to split into synchronized slides:
"${tutorResponse}"

Generate ${slideCount} slides with diagrams and audio sync markers.`
        }
      ],
      temperature: 0.7,
      maxTokens: 2500,
      responseFormat: 'json'
    });

    const content = completion.content || '{}';
    const parsed = JSON.parse(content);
    const slides = parsed.slides || [];

    // Calculate timing for each slide based on spoken content
    let accumulatedTime = 0;
    const processedSlides = slides.map((slide: any, index: number) => {
      const slideWordCount = (slide.spokenContent || slide.content || '').split(/\s+/).length;
      const slideDuration = Math.max((slideWordCount / wordsPerMinute) * 60, avgSlideDuration * 0.5);
      
      const processedSlide = {
        ...slide,
        id: slide.id || `slide-${Date.now()}-${index}`,
        isSimplified: isSimplified,
        simplificationLevel: simplificationLevel,
        audioStartTime: accumulatedTime,
        audioDuration: slideDuration,
        // Only use existing visualAid, don't generate automatic diagrams
        visualAid: slide.visualAid || undefined
      };
      
      accumulatedTime += slideDuration;
      return processedSlide;
    });

    return processedSlides;

  } catch (error) {
    console.error('Slide generation error:', error);
    return generateFallbackSlides(tutorResponse, topic, isSimplified);
  }
}

// Generate a diagram for a slide based on its content
function generateDiagramForSlide(
  slide: any,
  topic: string,
  isSimplified: boolean
): { type: 'mermaid' | 'illustration'; data: string } | undefined {
  const slideType = slide.type || 'concept';
  const content = slide.content || '';
  const title = slide.title || topic;

  // Only generate diagrams for certain slide types
  if (slideType !== 'concept' && slideType !== 'diagram' && slideType !== 'example') {
    return undefined;
  }

  // Generate simple mermaid diagram based on content
  const keyPoints = slide.keyPoints || [];
  
  if (keyPoints.length >= 2) {
    // Create a simple flowchart from key points
    const nodes = keyPoints.slice(0, 4).map((point: string, i: number) => {
      const shortPoint = point.substring(0, 30).replace(/["'`]/g, '');
      return `    P${i}["${shortPoint}${point.length > 30 ? '...' : ''}"]`;
    });
    
    const connections = nodes.map((_: string, i: number) => 
      i < nodes.length - 1 ? `    P${i} --> P${i + 1}` : ''
    ).filter(Boolean);

    const diagramData = [
      'graph TD',
      `    T["${title.substring(0, 25)}"]`,
      ...nodes,
      '    T --> P0',
      ...connections
    ].join('\n');

    return {
      type: 'mermaid',
      data: diagramData
    };
  }

  // Fallback: simple concept diagram
  return {
    type: 'mermaid',
    data: `graph TD\n    A["${title.substring(0, 25)}"] --> B["Key Concept"]\n    B --> C["Understanding"]`
  };
}

// Format code for spoken content (TTS)
function formatCodeForSpokenContent(code: string): string {
  // Remove code syntax and make it readable for TTS
  return code
    .replace(/```/g, '')
    .replace(/const|let|var/g, 'constant')
    .replace(/function/g, 'function')
    .replace(/=>/g, 'arrow function')
    .replace(/console\.log/g, 'console log')
    .replace(/app\.use/g, 'app use middleware')
    .replace(/app\.get/g, 'app get route')
    .replace(/app\.post/g, 'app post route')
    .replace(/req/g, 'request')
    .replace(/res/g, 'response')
    .replace(/next\(\)/g, 'next function')
    .replace(/[{}]/g, '')
    .replace(/;/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

// Format code for display with proper syntax highlighting and structure
function formatCodeForDisplay(code: string): string {
  // Ensure proper formatting first
  let formattedCode = code.trim();
  
  // Remove setup/execution sections that users don't want
  formattedCode = formattedCode
    .replace(/\/\/ ===== SETUP =====[\s\S]*?\/\/ =====/g, '// =====')
    .replace(/\/\/ ===== EXECUTION =====[\s\S]*?\/\/ =====/g, '// =====')
    .replace(/\/\/ ===== RUN =====[\s\S]*?\/\/ =====/g, '// =====')
    .replace(/Setup:|Execution:|Run:|To run:|To execute:/gi, '')
    .replace(/npm install|npm start|node app\.js|python app\.py/g, '');
  
  // Clean up section headers (minimal emojis)
  formattedCode = formattedCode
    .replace(/\/\/ ===== ([A-Z\s]+) =====/g, '\n// ===== $1 =====\n')
    .replace(/\/\/ ([A-Z][a-zA-Z\s]+)/g, '// $1')
    .replace(/IMPORTANT:/g, 'IMPORTANT:')
    .replace(/In real app:/g, 'In real app:');
  
  // Ensure proper indentation and clean formatting
  const lines = formattedCode.split('\n');
  const indentedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Preserve comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine === '') {
      return line;
    }
    
    // Add proper indentation for code
    if (trimmedLine && !line.startsWith('  ') && !line.startsWith('    ')) {
      return '  ' + trimmedLine;
    }
    
    return trimmedLine;
  });
  
  return indentedLines.join('\n');
}

// Extract code sections for key points
function extractCodeSections(code: string): string[] {
  const sections: string[] = [];
  
  // Look for section comments
  const sectionMatches = code.matchAll(/\/\/ ===== ([A-Z\s]+) =====\n([\s\S]*?)(?=\n\/\/ =====|\n\/\/ [A-Z]|\n\n|$)/g);
  
  for (const match of sectionMatches) {
    const sectionName = match[1].trim();
    sections.push(`📁 ${sectionName}`);
  }
  
  // Look for important comments
  const importantMatches = code.matchAll(/\/\/ (IMPORTANT|In real app|NOTE): ([^\n]+)/g);
  for (const match of importantMatches) {
    sections.push(`⚠️  ${match[1]}: ${match[2]}`);
  }
  
  // If no sections found, provide generic ones
  if (sections.length === 0) {
    if (code.includes('app.use')) sections.push('🔧 Middleware setup');
    if (code.includes('app.get')) sections.push('🌐 GET route defined');
    if (code.includes('app.post')) sections.push('📝 POST route defined');
    if (code.includes('listen')) sections.push('🚀 Server started');
  }
  
  return sections.slice(0, 3);
}

// Generate code flow diagram
function generateCodeFlowDiagram(code: string): { type: 'mermaid' | 'illustration' | 'flowchart'; data: string } {
  const nodes: string[] = [];
  let nodeIndex = 0;
  
  // Add setup node
  nodes.push(`    P${nodeIndex}["📁 Setup"]`);
  nodeIndex++;
  
  // Add middleware nodes
  if (code.includes('app.use')) {
    nodes.push(`    P${nodeIndex}["🔧 Middleware"]`);
    nodeIndex++;
  }
  
  // Add route nodes
  if (code.includes('app.get')) {
    nodes.push(`    P${nodeIndex}["📥 GET Routes"]`);
    nodeIndex++;
  }
  
  if (code.includes('app.post')) {
    nodes.push(`    P${nodeIndex}["📤 POST Routes"]`);
    nodeIndex++;
  }
  
  // Add server node
  nodes.push(`    P${nodeIndex}["🚀 Server Start"]`);
  
  const connections = nodes.map((_: string, i: number) => 
    i < nodes.length - 1 ? `    P${i} --> P${i + 1}` : ''
  ).filter(Boolean);

  const diagramData = [
    'graph TD',
    '    Start["🎯 Code Execution"]',
    ...nodes,
    '    Start --> P0',
    ...connections
  ].join('\n');

  return {
    type: 'mermaid',
    data: diagramData
  };
}

function generateFallbackSlides(
  tutorResponse: string,
  topic: string,
  isSimplified: boolean
): GeneratedSlide[] {
  // Extract first 200 chars for summary
  const shortContent = tutorResponse.substring(0, 200);
  const keyPoints = extractKeyPoints(tutorResponse);

  return [
    {
      id: `slide-${Date.now()}-0`,
      title: isSimplified ? `Let's Learn: ${topic}` : `Understanding ${topic}`,
      type: 'concept',
      content: isSimplified 
        ? `Here's the simple version of what we're learning about ${topic}.`
        : shortContent + '...',
      keyPoints: keyPoints.slice(0, isSimplified ? 2 : 3),
      isSimplified,
      simplificationLevel: isSimplified ? 'basic' : 'intermediate'
    },
    {
      id: `slide-${Date.now()}-1`,
      title: isSimplified ? 'Think of it Like This' : 'Key Takeaways',
      type: 'summary',
      content: isSimplified
        ? 'Here are the most important things to remember:'
        : 'Key points from this explanation:',
      keyPoints: keyPoints.slice(0, isSimplified ? 3 : 4),
      isSimplified,
      simplificationLevel: isSimplified ? 'basic' : 'intermediate'
    }
  ]
}
