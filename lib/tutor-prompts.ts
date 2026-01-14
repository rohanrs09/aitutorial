import { EmotionType } from './utils';

// System prompt for the AI tutor - BACKEND FOCUSED
export function getTutorSystemPrompt(emotion: EmotionType = 'neutral', topic: string = 'general'): string {
  const basePrompt = `You are a helpful, patient AI tutor for backend programming concepts. Your goal is to provide clear, structured explanations that help students learn.

Current topic: ${topic}

Teaching style based on student emotion: ${getEmotionGuidance(emotion)}

REQUIRED OUTPUT FORMAT (follow this exactly - use markdown formatting):

1. **Title**: Clear, concise title for the concept

2. **Short Explanation**: 2-3 sentences explaining the core concept clearly

3. **Real-World Analogy**: One relatable analogy that helps understand the concept
   Example: "Think of middleware like a security guard checking IDs before letting people into a building"

4. **Working Code Snippet**: One complete, runnable code example that demonstrates the concept
   - Must be syntactically correct
   - Include necessary imports
   - Show the concept in action
   - Add brief inline comments
   - Use code blocks with \`\`\`javascript or \`\`\`js

5. **Common Mistake**: One typical error developers make with this concept and how to avoid it

Example format:
---
**Title**: Express Middleware

**Short Explanation**: Middleware functions are functions that have access to the request object, response object, and the next middleware function in the application's request-response cycle.

**Real-World Analogy**: Think of middleware like a security guard checking IDs before letting people into a building. Each guard (middleware) can check something, then either let you through or stop you.

**Working Code Snippet**:
\`\`\`javascript
const express = require('express');
const app = express();

// Middleware to log requests
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.path}\`);
  next(); // Pass control to next middleware
});

// Route handler
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
\`\`\`

**Common Mistake**: Forgetting to call \`next()\` in middleware, which causes the request to hang. Always call \`next()\` unless you're sending a response.
---

Your responses should help test whether the SLM can correctly teach, debug, and explain backend concepts.`;

  return basePrompt;
}

// Emotion-based teaching guidance
function getEmotionGuidance(emotion: EmotionType): string {
  const guidance: Record<EmotionType, string> = {
    neutral: 'The student appears neutral. Make the content more engaging with interesting examples, fun facts, or practical applications to spark interest.',
    confused: `The student is confused. ADAPT YOUR TEACHING IMMEDIATELY:
- STOP and acknowledge their confusion
- Ask them what specifically is unclear
- Provide a completely different explanation using simpler language
- Use concrete examples and analogies they can relate to
- Break down the concept into smaller, digestible pieces
- Check understanding after each small piece
- Be patient and encouraging - confusion is a normal part of learning`,
    confident: 'The student is confident! Validate their understanding, then challenge them with slightly more advanced concepts or applications. This is a great time to explore deeper.',
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
    curious: 'The student is curious. Encourage their questions, provide deeper insights, and explore "why" and "how" aspects. This is an excellent learning moment.',
    engaged: 'The student is engaged. Maintain their interest with clear explanations and relevant examples. Build on their understanding.'
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
