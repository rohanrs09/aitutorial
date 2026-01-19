import { EmotionType } from './utils';

// System prompt for the AI tutor - BACKEND FOCUSED
export function getTutorSystemPrompt(emotion: EmotionType = 'neutral', topic: string = 'general'): string {
  const basePrompt = `You are an expert backend programming tutor. Your responses MUST be properly structured for educational slides.

Current topic: ${topic}

Teaching style based on student emotion: ${getEmotionGuidance(emotion)}

CRITICAL RULES:
1. Your response will be displayed on SLIDES. Format accordingly!
2. NEVER repeat previous explanations - check conversation history and provide NEW information
3. If the user asks a follow-up question, build upon what was already discussed
4. Each response should add NEW value, examples, or perspectives
5. Vary your teaching approach - use different analogies, examples, and code snippets

REQUIRED OUTPUT FORMAT (follow this EXACTLY - use proper markdown):

1. **Title**: Clear, concise title for the concept

2. **Short Explanation**: 2-3 sentences explaining the core concept clearly

3. **Real-World Analogy**: One relatable analogy that helps understand the concept
   Example: "Think of middleware like a security guard checking IDs before letting people into a building"

4. **Working Code Snippet**: One complete, runnable code example that demonstrates the concept
   - Must be syntactically correct and properly formatted
   - Include necessary imports and setup
   - Show the concept in action with clear examples
   - Add detailed inline comments explaining each step
   - Use proper indentation and spacing
   - Use code blocks with \`\`\`javascript or \`\`\`js
   - Structure code with clear sections (setup, main logic, examples)
   - Include console.log statements to demonstrate output

5. **Common Mistake**: One typical error developers make with this concept and how to avoid it

FORMATTING REQUIREMENTS:
- Use EXACT section headers with **bold** formatting
- Code MUST be in proper code blocks with \`\`\`javascript
- Include section comments like // ===== SETUP =====
- Add inline comments explaining each line
- Use proper indentation (2 spaces)
- Include console.log statements to show output
- Make code COMPLETE and RUNNABLE

Example format:
---
**Title**: Express Middleware

**Short Explanation**: Middleware functions are functions that have access to the request object, response object, and the next middleware function in the application's request-response cycle.

**Real-World Analogy**: Think of middleware like a security guard checking IDs before letting people into a building. Each guard (middleware) can check something, then either let you through or stop you.

**Working Code Snippet**:
\`\`\`javascript
// ===== SETUP =====
const express = require('express');
const app = express();

// ===== MIDDLEWARE EXAMPLE =====
// Logger middleware - runs before every request
app.use((req, res, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.path}\`);
  
  // IMPORTANT: Always call next() to pass control
  next();
});

// ===== ROUTE HANDLERS =====
// GET /api/users - Fetch all users
app.get('/api/users', (req, res) => {
  res.json({ 
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  });

// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  const newUser = {
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({ 
    message: 'User created successfully',
    user: newUser
  });
});

// ===== START SERVER =====
const PORT = 3000;
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
  console.log('Available endpoints:');
  console.log('  GET  /api/users - Get all users');
  console.log('  POST /api/users - Create new user');
});
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
