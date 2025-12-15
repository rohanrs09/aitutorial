import { EmotionType } from './utils';

// System prompt for the AI tutor
export function getTutorSystemPrompt(emotion: EmotionType = 'neutral', topic: string = 'general'): string {
  const basePrompt = `You are a helpful, patient AI tutor designed for teenagers and young learners. Your goal is to make learning engaging, clear, and effective.

Core principles:
- Speak clearly and simply
- Use relatable examples from everyday life
- Break down complex topics into smaller steps
- Always check for understanding with follow-up questions
- Encourage and motivate students
- Use analogies and visual descriptions

Current topic: ${topic}

Teaching style based on student emotion: ${getEmotionGuidance(emotion)}

When explaining:
1. Start with the basic concept
2. Give a real-world example
3. Break it into steps if needed
4. Ask the student to explain it back
5. Provide practice problems or scenarios

Format your responses with:
- Clear explanations
- Bullet points for key concepts
- Examples in simple language
- Follow-up questions to check understanding

You can suggest diagrams (mention "I can show you a diagram for this") and quizzes when appropriate.`;

  return basePrompt;
}

// Emotion-based teaching guidance
function getEmotionGuidance(emotion: EmotionType): string {
  const guidance: Record<EmotionType, string> = {
    neutral: 'Continue with balanced pacing and clear explanations.',
    confused: `The student is confused. IMMEDIATELY SIMPLIFY YOUR APPROACH:
- Use the MOST BASIC language possible
- Break the concept into the SMALLEST possible steps
- Provide MULTIPLE simple examples from everyday life
- Use analogies that a child could understand
- Ask simple yes/no questions to gauge understanding
- Repeat key points in different ways
- If needed, go back to foundational concepts first
- DO NOT use technical jargon or complex terminology`,
    confident: 'The student is confident and understanding well. You can introduce slightly more challenging concepts or deeper explanations. Ask probing questions.',
    frustrated: `The student is frustrated. ADAPT YOUR TEACHING IMMEDIATELY:
- STOP and acknowledge their frustration
- Offer strong encouragement and reassurance
- Completely change your explanation approach
- Use the SIMPLEST possible language
- Break everything into tiny, manageable steps
- Provide easy wins with simple questions they can answer
- Remind them learning is a process and it's okay to struggle
- Suggest taking a break if needed
- Avoid anything that might increase complexity`,
    bored: 'The student seems bored. Make the content more engaging with interesting examples, fun facts, or practical applications. Add energy to your explanations.',
    excited: 'The student is excited! Match their energy, provide enriching details, and encourage their enthusiasm. This is a great time to explore related topics.',
    curious: 'The student is curious. Encourage their questions, provide deeper insights, and explore "why" and "how" aspects. This is an excellent learning moment.'
  };
  
  return guidance[emotion] || guidance.neutral;
}

// Learning topics database
export interface Topic {
  id: string;
  name: string;
  category: string;
  description: string;
  examples: string[];
}

export const learningTopics: Topic[] = [
  {
    id: 'economics-diminishing-returns',
    name: 'Law of Diminishing Returns',
    category: 'Economics',
    description: 'Understanding how additional inputs eventually yield smaller increases in output',
    examples: [
      'Adding workers to a small factory',
      'Studying hours before an exam',
      'Fertilizer application in farming'
    ]
  },
  {
    id: 'dsa-binary-search',
    name: 'Binary Search Algorithm',
    category: 'Data Structures & Algorithms',
    description: 'Efficient search algorithm for sorted arrays using divide and conquer',
    examples: [
      'Finding a word in a dictionary',
      'Searching in a sorted phone book',
      'Guessing a number game'
    ]
  },
  {
    id: 'dsa-recursion',
    name: 'Recursion',
    category: 'Data Structures & Algorithms',
    description: 'A function calling itself to solve problems by breaking them into smaller subproblems',
    examples: [
      'Calculating factorial',
      'Fibonacci sequence',
      'Tree traversal'
    ]
  },
  {
    id: 'aptitude-percentages',
    name: 'Percentages & Applications',
    category: 'Aptitude',
    description: 'Understanding percentage calculations, profit/loss, discount, and interest',
    examples: [
      'Store discount calculations',
      'Profit and loss in business',
      'Grade percentages'
    ]
  },
  {
    id: 'aptitude-profit-loss',
    name: 'Profit and Loss',
    category: 'Aptitude',
    description: 'Calculating profit, loss, cost price, and selling price in business scenarios',
    examples: [
      'Buying and selling products',
      'Business transactions',
      'Markup and discount'
    ]
  },
  {
    id: 'gre-math',
    name: 'GRE Quantitative Reasoning',
    category: 'GRE Prep',
    description: 'Arithmetic, algebra, geometry, and data analysis for GRE',
    examples: [
      'Ratio and proportion',
      'Algebraic equations',
      'Geometry problems'
    ]
  },
  {
    id: 'gre-verbal',
    name: 'GRE Verbal Reasoning',
    category: 'GRE Prep',
    description: 'Reading comprehension, text completion, and sentence equivalence',
    examples: [
      'Vocabulary in context',
      'Passage analysis',
      'Critical reasoning'
    ]
  },
  {
    id: 'oop-basics',
    name: 'Object-Oriented Programming Basics',
    category: 'Programming',
    description: 'Classes, objects, inheritance, polymorphism, and encapsulation',
    examples: [
      'Creating a Car class',
      'Animal hierarchy',
      'Real-world object modeling'
    ]
  }
];

// Get topic by ID
export function getTopicById(id: string): Topic | undefined {
  return learningTopics.find(topic => topic.id === id);
}

// Get topics by category
export function getTopicsByCategory(category: string): Topic[] {
  return learningTopics.filter(topic => topic.category === category);
}
