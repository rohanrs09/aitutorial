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

IMMEDIATELY SIMPLIFY your response:
1. Use the MOST BASIC language possible (explain as if to a 10-year-old)
2. Break the concept into the SMALLEST possible steps (no more than 3-4 words per step)
3. Start with the absolute fundamentals - don't assume ANY prior knowledge
4. Use MULTIPLE simple analogies from everyday life (cooking, sports, games, etc.)
5. Provide a concrete visual example or scenario
6. Use short sentences (max 10-12 words each)
7. Ask simple yes/no questions to check understanding
8. Avoid ALL technical jargon and complex terms
9. If you must use a technical term, define it in the simplest way first
10. Repeat the key idea in different ways

Example format:
"Let me explain this in the simplest way:
[Simple analogy]
Here's what this means:
Step 1: [Simple action]
Step 2: [Simple action]
Step 3: [Simple action]

Think of it like [everyday example].

Does this make sense so far?"`;
  }
  
  if (emotion === 'frustrated') {
    return `The student is FRUSTRATED about: "${userMessage}"

COMPLETELY CHANGE YOUR APPROACH:
1. Start with validation: "I know this can be frustrating. Let's try a totally different way."
2. STOP using the previous explanation method
3. Use the ABSOLUTE SIMPLEST language
4. Break it down into TINY steps
5. Provide immediate, easy wins with simple concepts they CAN understand
6. Use encouraging language throughout
7. Suggest it's okay to take a break if needed
8. Focus on building confidence first, comprehension second
9. Use familiar, comforting analogies (family, home, daily routine)
10. Keep paragraphs very short (2-3 sentences max)

Example format:
"I totally understand your frustration. Let's try this a completely different way.

Forget everything for a moment. 

Think about [super simple everyday thing they definitely know].

Now, [our concept] is just like that, but [one simple difference].

That's it. That's the core idea.

Want me to show you a really simple example?"`;
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
  confidence: number
): string {
  const adaptation = analyzeEmotionAndAdapt(emotion, confidence, '');
  
  if (adaptation.additionalPrompt) {
    return `${basePrompt}\n\n${adaptation.additionalPrompt}`;
  }
  
  return basePrompt;
}