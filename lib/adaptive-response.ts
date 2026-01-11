import { EmotionType } from './utils';

export interface AdaptiveResponse {
  message: string;
  shouldRegenerateSimplified: boolean;
  simplificationLevel: 'basic' | 'intermediate' | 'advanced';
  additionalPrompt?: string;
}

export function analyzeEmotionAndAdapt(
  emotion: EmotionType,
  confidence: number,
  userMessage: string
): AdaptiveResponse {
  // High confidence negative emotions trigger automatic simplification
  if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.6) {
    return {
      message: '',
      shouldRegenerateSimplified: true,
      simplificationLevel: 'basic',
      additionalPrompt: generateSimplificationPrompt(emotion, userMessage)
    };
  }
  
  // Medium confidence negative emotions suggest simplification
  if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.4) {
    return {
      message: '',
      shouldRegenerateSimplified: true,
      simplificationLevel: 'intermediate',
      additionalPrompt: generateSimplificationPrompt(emotion, userMessage)
    };
  }
  
  // Bored emotion needs engagement boost
  if (emotion === 'bored' && confidence > 0.5) {
    return {
      message: '',
      shouldRegenerateSimplified: false,
      simplificationLevel: 'intermediate',
      additionalPrompt: 'Make this explanation more engaging with interesting facts, real-world applications, and enthusiasm. Use storytelling techniques.'
    };
  }
  
  // Confident students can handle more advanced content
  if (emotion === 'confident' && confidence > 0.7) {
    return {
      message: '',
      shouldRegenerateSimplified: false,
      simplificationLevel: 'advanced',
      additionalPrompt: 'The student is confident. Provide deeper insights, advanced concepts, and challenging follow-up questions.'
    };
  }
  
  return {
    message: '',
    shouldRegenerateSimplified: false,
    simplificationLevel: 'intermediate'
  };
}

function generateSimplificationPrompt(emotion: EmotionType, userMessage: string): string {
  if (emotion === 'confused') {
    return `The student is CONFUSED about: "${userMessage}"

IMMEDIATELY SIMPLIFY your response (BACKEND FOCUS):
1. Use the MOST BASIC language possible (explain as if to a beginner)
2. Break the backend concept into the SMALLEST possible steps
3. Start with the absolute fundamentals - don't assume ANY prior knowledge
4. Use ONE clear real-world analogy related to backend concepts
5. Provide a SIMPLE, working code snippet that demonstrates the concept
6. Explain WHY the code works, line by line
7. Show ONE common mistake and how to fix it
8. Avoid ALL unnecessary technical jargon
9. If you must use a technical term, define it in the simplest way first
10. Keep code examples minimal and focused

Follow the required format:
- Title
- Short explanation (2-3 sentences)
- One real-world analogy
- One working code snippet (simple, runnable)
- One common mistake

Do NOT generate slides, UI, or design content. Focus ONLY on backend learning.`;
  }
  
  if (emotion === 'frustrated') {
    return `The student is FRUSTRATED about: "${userMessage}"

COMPLETELY CHANGE YOUR APPROACH (BACKEND FOCUS):
1. Start with validation: "I know this can be frustrating. Let's debug this step by step."
2. STOP using the previous explanation method
3. Use the ABSOLUTE SIMPLEST language
4. Break the backend logic down into TINY steps
5. Provide a MINIMAL working code example they can run immediately
6. Show them EXACTLY what to type and what output to expect
7. Use encouraging language throughout
8. Focus on ONE working example first, then explain why it works
9. Use a simple, relatable analogy for the backend concept
10. Show the most common mistake with this concept and how to avoid it

Follow the required format:
- Title
- Short explanation (acknowledge frustration, then explain simply)
- One real-world analogy (comforting, familiar)
- One working code snippet (MINIMAL, runnable, with expected output)
- One common mistake (what they're likely doing wrong)

Do NOT generate slides, UI, or design content. Focus ONLY on getting the backend code to work.`;
  }
  
  return '';
}

export function shouldAutoGenerateSimplifiedResponse(
  emotion: EmotionType,
  confidence: number,
  consecutiveNegativeCount: number
): boolean {
  // Auto-generate after 2 consecutive negative emotions
  if (consecutiveNegativeCount >= 2) return true;
  
  // Auto-generate for high confidence confusion/frustration
  if ((emotion === 'confused' || emotion === 'frustrated') && confidence > 0.7) return true;
  
  return false;
}

export function enhancePromptForEmotion(
  basePrompt: string,
  emotion: EmotionType,
  confidence: number,
  userMessage?: string
): string {
  // Pass user message to get context-aware simplification prompts
  const adaptation = analyzeEmotionAndAdapt(emotion, confidence, userMessage || '');
  
  if (adaptation.additionalPrompt) {
    return `${basePrompt}\n\n${adaptation.additionalPrompt}`;
  }
  
  return basePrompt;
}