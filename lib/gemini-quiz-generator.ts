/**
 * GEMINI QUIZ GENERATOR
 * 
 * Dedicated service for generating high-quality quiz questions using Google Gemini API
 * Features:
 * - Topic-based question generation from course content
 * - Proper answer validation and explanation
 * - Difficulty-aware generation
 * - Structured JSON output
 * - Answer analysis and feedback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizQuestion, DifficultyLevel } from './quiz-types';
import { getCourseContentForTopic } from './quiz-generator';

interface GeminiQuizConfig {
  topic: string;
  questionCount: number;
  difficulty: DifficultyLevel | 'mixed';
  subtopics?: string[];
  userContext?: {
    weakAreas?: string[];
    masteryLevel?: number;
  };
}

interface QuestionGenerationResult {
  questions: QuizQuestion[];
  metadata: {
    topic: string;
    generatedCount: number;
    difficultyDistribution: Record<string, number>;
    subtopicsCovered: string[];
  };
}

/**
 * Initialize Gemini client with API key validation
 */
function initializeGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env.local file.');
  }
  
  if (apiKey.length < 20) {
    throw new Error('GEMINI_API_KEY appears to be invalid (too short). Please verify your API key.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Build a comprehensive prompt for Gemini to generate quiz questions
 * Enhanced to generate highly topic-specific questions
 */
function buildGeminiQuizPrompt(config: GeminiQuizConfig, courseContent: any): string {
  const { topic, questionCount, difficulty, subtopics, userContext } = config;
  
  // Calculate difficulty distribution
  let difficultyBreakdown = '';
  if (difficulty === 'mixed') {
    const easy = Math.ceil(questionCount * 0.3);
    const medium = Math.ceil(questionCount * 0.5);
    const hard = questionCount - easy - medium;
    difficultyBreakdown = `Generate ${easy} easy, ${medium} medium, and ${hard} hard questions.`;
  } else {
    difficultyBreakdown = `Generate all ${questionCount} questions at ${difficulty} difficulty level.`;
  }
  
  // Build subtopic guidance
  let subtopicGuidance = '';
  if (subtopics && subtopics.length > 0) {
    subtopicGuidance = `\n\nFocus on these subtopics: ${subtopics.join(', ')}`;
  }
  
  // Build user context guidance
  let contextGuidance = '';
  if (userContext?.weakAreas && userContext.weakAreas.length > 0) {
    contextGuidance = `\n\nUser's weak areas: ${userContext.weakAreas.join(', ')}. Include questions that help strengthen these areas.`;
  }
  
  // Get topic-specific content and examples
  const topicExamples = getTopicSpecificExamples(topic);
  
  // Course content context
  let contentContext = '';
  if (courseContent) {
    contentContext = `\n\nCourse Content for Reference:\n${JSON.stringify(courseContent, null, 2)}`;
  }
  
  return `You are an expert educational quiz generator specializing in creating high-quality, topic-specific assessment questions.

=== QUIZ SPECIFICATIONS ===
📚 Topic: "${topic}"
📊 Questions Required: ${questionCount}
🎯 Difficulty: ${difficultyBreakdown}${subtopicGuidance}${contextGuidance}

=== TOPIC-SPECIFIC GUIDANCE ===
${topicExamples}

=== CRITICAL QUALITY REQUIREMENTS ===

1. **Topic Accuracy** 🎯
   - EVERY question MUST be directly and specifically about "${topic}"
   - NO generic questions that could apply to any topic
   - Focus on the unique concepts, principles, and applications of "${topic}"
   - If the topic is technical (programming, math, science), include relevant terminology and concepts

2. **Question Design** 📝
   - Test UNDERSTANDING and APPLICATION, not just memorization
   - Include real-world scenarios and practical examples
   - For technical topics: Include code snippets, algorithms, or formulas where appropriate
   - For conceptual topics: Use case studies, scenarios, or thought experiments
   - Questions should be clear, unambiguous, and professionally written

3. **Answer Options** ✅
   - Provide EXACTLY 4 options (A, B, C, D)
   - All options must be plausible and relevant to the question
   - Avoid obviously wrong "joke" answers
   - Distractors should test common misconceptions or similar concepts
   - Options should be roughly similar in length and complexity

4. **Correct Answer** ✓
   - correctAnswer must be the index: 0, 1, 2, or 3
   - Only ONE option should be definitively correct
   - Ensure the correct answer is factually accurate

5. **Explanations** 💡
   - Explain WHY the correct answer is right (with reasoning/proof)
   - Explain WHY each incorrect option is wrong
   - Include additional learning points or related concepts
   - Use clear, educational language
   - Length: 2-4 sentences minimum

=== DIFFICULTY CALIBRATION ===

**EASY** (Basic Knowledge):
- Definitions, terminology, basic concepts
- Simple recall or identification
- Fundamental principles
- Example: "What does HTML stand for?"

**MEDIUM** (Application & Analysis):
- Comparing approaches or methods
- Applying concepts to scenarios
- Analyzing code or processes
- Problem-solving with known techniques
- Example: "Which data structure would be most efficient for implementing an undo feature?"

**HARD** (Synthesis & Evaluation):
- Complex multi-step problems
- Edge cases and optimization
- Combining multiple concepts
- Advanced scenarios requiring deep understanding
- Example: "Given a distributed system with eventual consistency, how would you handle conflicting updates?"

${contentContext}

=== OUTPUT FORMAT (STRICT) ===

Return ONLY a valid JSON array. No markdown code blocks, no explanatory text, no comments.

[
  {
    "id": "${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1",
    "topic": "${topic}",
    "subtopic": "Specific aspect of ${topic}",
    "question": "Clear, specific question testing knowledge of ${topic}",
    "type": "multiple-choice",
    "difficulty": "easy",
    "options": [
      "First plausible option",
      "Second plausible option",
      "Third plausible option",
      "Fourth plausible option"
    ],
    "correctAnswer": 0,
    "explanation": "The correct answer is [option] because [detailed reasoning]. Option B is incorrect because [reason]. Option C is wrong because [reason]. Option D is incorrect because [reason].",
    "points": 10
  }
]

=== PRE-GENERATION CHECKLIST ===
Before generating, ensure:
✓ You understand the topic "${topic}" thoroughly
✓ Questions will test specific knowledge of "${topic}"
✓ All ${questionCount} questions will be unique and non-repetitive
✓ Difficulty distribution matches the requirement
✓ Each question has educational value
✓ Explanations teach, not just state facts
✓ JSON format is valid and parseable

=== GENERATE NOW ===
Create ${questionCount} high-quality quiz questions about "${topic}" following ALL requirements above:`;
}

/**
 * Get topic-specific examples and guidance for better question generation
 */
function getTopicSpecificExamples(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  // Data Structures topics
  if (topicLower.includes('array') || topicLower.includes('string')) {
    return `Topic Focus: Arrays & Strings
Key concepts to cover:
- Array indexing and access (O(1))
- Array insertion/deletion (O(n))
- String immutability
- Two-pointer technique
- Sliding window pattern
- String manipulation methods

Example question types:
- Time complexity of operations
- Best approach for specific problems
- Code output prediction
- Edge case handling`;
  }
  
  if (topicLower.includes('linked list')) {
    return `Topic Focus: Linked Lists
Key concepts to cover:
- Singly vs Doubly linked lists
- Insertion/deletion at head, tail, middle
- Traversal techniques
- Cycle detection (Floyd's algorithm)
- Reversal techniques
- Comparison with arrays

Example question types:
- Time complexity comparisons
- Code for common operations
- When to use linked list vs array
- Pointer manipulation`;
  }
  
  if (topicLower.includes('stack') || topicLower.includes('queue')) {
    return `Topic Focus: Stacks & Queues
Key concepts to cover:
- LIFO vs FIFO principles
- Push, pop, peek operations
- Implementation using arrays/linked lists
- Applications (expression evaluation, BFS/DFS)
- Priority queues
- Deque operations

Example question types:
- Operation sequences and final state
- Best data structure for scenarios
- Implementation details
- Real-world applications`;
  }
  
  if (topicLower.includes('tree') || topicLower.includes('binary')) {
    return `Topic Focus: Trees
Key concepts to cover:
- Binary tree properties
- BST operations and properties
- Tree traversals (inorder, preorder, postorder, level-order)
- Balanced trees (AVL, Red-Black)
- Tree height and depth
- Common algorithms (LCA, diameter)

Example question types:
- Traversal output prediction
- BST property validation
- Time complexity of operations
- Tree construction from traversals`;
  }
  
  if (topicLower.includes('graph')) {
    return `Topic Focus: Graphs
Key concepts to cover:
- Graph representations (adjacency list/matrix)
- BFS and DFS traversals
- Shortest path algorithms (Dijkstra, Bellman-Ford)
- Minimum spanning tree (Prim, Kruskal)
- Topological sorting
- Cycle detection

Example question types:
- Algorithm selection for problems
- Traversal order prediction
- Time/space complexity
- Graph property identification`;
  }
  
  if (topicLower.includes('hash') || topicLower.includes('map') || topicLower.includes('dictionary')) {
    return `Topic Focus: Hash Tables
Key concepts to cover:
- Hash function properties
- Collision resolution (chaining, open addressing)
- Load factor and rehashing
- Time complexity (average vs worst case)
- Applications and use cases
- Comparison with other data structures

Example question types:
- Hash function evaluation
- Collision handling scenarios
- When to use hash tables
- Implementation details`;
  }
  
  if (topicLower.includes('sort')) {
    return `Topic Focus: Sorting Algorithms
Key concepts to cover:
- Comparison-based sorts (Quick, Merge, Heap)
- Non-comparison sorts (Counting, Radix)
- Time/space complexity analysis
- Stability of sorting algorithms
- Best/worst/average cases
- Choosing the right algorithm

Example question types:
- Algorithm identification from steps
- Complexity analysis
- Stability questions
- Best algorithm for specific scenarios`;
  }
  
  if (topicLower.includes('search') || topicLower.includes('binary search')) {
    return `Topic Focus: Searching Algorithms
Key concepts to cover:
- Linear search vs Binary search
- Binary search prerequisites and variations
- Search in rotated arrays
- Finding boundaries (first/last occurrence)
- Time complexity analysis
- Applications and modifications

Example question types:
- Binary search implementation
- Complexity analysis
- Edge cases and boundaries
- Modified binary search problems`;
  }
  
  if (topicLower.includes('recursion') || topicLower.includes('dynamic')) {
    return `Topic Focus: Recursion & Dynamic Programming
Key concepts to cover:
- Base case and recursive case
- Call stack and memory usage
- Memoization vs Tabulation
- Identifying overlapping subproblems
- Optimal substructure
- Common DP patterns

Example question types:
- Recurrence relation analysis
- Time/space complexity
- Converting recursion to DP
- Problem identification`;
  }
  
  // Default for other topics
  return `Topic Focus: ${topic}
Generate questions that:
- Test core concepts of ${topic}
- Include practical applications
- Cover different difficulty levels
- Use real-world scenarios when possible
- Include code snippets where relevant`;
}

/**
 * Validate and normalize questions from Gemini response
 */
function validateGeminiQuestions(questions: any[], topic: string): QuizQuestion[] {
  const validated: QuizQuestion[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    try {
      // Validate required fields
      if (!q.question || typeof q.question !== 'string') {
        console.warn(`[GeminiQuiz] Question ${i} missing valid question text`);
        continue;
      }
      
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.warn(`[GeminiQuiz] Question ${i} must have exactly 4 options`);
        continue;
      }
      
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        console.warn(`[GeminiQuiz] Question ${i} has invalid correctAnswer index`);
        continue;
      }
      
      if (!q.explanation || typeof q.explanation !== 'string') {
        console.warn(`[GeminiQuiz] Question ${i} missing explanation`);
        continue;
      }
      
      // Validate difficulty
      const validDifficulties = ['easy', 'medium', 'hard'];
      const difficulty = validDifficulties.includes(q.difficulty) ? q.difficulty : 'medium';
      
      // Create validated question
      const validatedQuestion: QuizQuestion = {
        id: q.id || `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
        topic: topic,
        subtopic: q.subtopic || topic,
        question: q.question.trim(),
        type: 'multiple-choice',
        difficulty: difficulty as DifficultyLevel,
        options: q.options.map((opt: any) => String(opt).trim()),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation.trim(),
        points: q.points || (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20),
      };
      
      validated.push(validatedQuestion);
    } catch (error) {
      console.error(`[GeminiQuiz] Error validating question ${i}:`, error);
      continue;
    }
  }
  
  return validated;
}

/**
 * Parse Gemini response and extract JSON
 */
function parseGeminiResponse(content: string): any[] {
  let cleanContent = content.trim();
  
  // Remove markdown code blocks
  cleanContent = cleanContent.replace(/```json\s*/gi, '');
  cleanContent = cleanContent.replace(/```\s*/g, '');
  
  // Find JSON array
  const arrayMatch = cleanContent.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleanContent = arrayMatch[0];
  } else {
    // Try to find the start of an array
    const startIndex = cleanContent.indexOf('[');
    if (startIndex !== -1) {
      const endIndex = cleanContent.lastIndexOf(']');
      if (endIndex !== -1) {
        cleanContent = cleanContent.substring(startIndex, endIndex + 1);
      }
    }
  }
  
  try {
    const parsed = JSON.parse(cleanContent);
    
    // Handle wrapper objects
    if (!Array.isArray(parsed)) {
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
      throw new Error('Response is not an array and has no questions property');
    }
    
    return parsed;
  } catch (error: any) {
    console.error('[GeminiQuiz] JSON parse error:', error.message);
    console.error('[GeminiQuiz] Content preview:', cleanContent.substring(0, 500));
    throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
  }
}

/**
 * Generate quiz questions using Gemini API
 * Uses v1 stable API with gemini-1.0-pro model
 */
export async function generateQuizWithGemini(config: GeminiQuizConfig): Promise<QuestionGenerationResult> {
  console.log('[GeminiQuiz] Starting generation:', {
    topic: config.topic,
    count: config.questionCount,
    difficulty: config.difficulty,
  });
  
  try {
    // Initialize Gemini
    const genAI = initializeGemini();
    
    // Use gemini-1.5-flash which is widely available
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
    
    // Debug logging
    console.log("[GeminiQuiz] Gemini API Key:", process.env.GEMINI_API_KEY?.slice(0, 8) + "...");
    console.log("[GeminiQuiz] Using model:", modelName);

    const model = genAI.getGenerativeModel({
      model: modelName,
    });
    
    // Get course content for context
    const courseContent = await getCourseContentForTopic(config.topic);
    
    // Build prompt
    const prompt = buildGeminiQuizPrompt(config, courseContent);
    
    // Generate content with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000)
    );
    
    const generationPromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        topP: 0.8,
        topK: 40,
      },
    });
    
    const result = await Promise.race([generationPromise, timeoutPromise]) as any;
    
    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }
    
    const response = result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    console.log('[GeminiQuiz] Received response, length:', text.length);
    
    // Parse and validate questions
    const parsedQuestions = parseGeminiResponse(text);
    const validatedQuestions = validateGeminiQuestions(parsedQuestions, config.topic);
    
    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions generated. Please try again.');
    }
    
    // Calculate metadata
    const difficultyDistribution = {
      easy: validatedQuestions.filter(q => q.difficulty === 'easy').length,
      medium: validatedQuestions.filter(q => q.difficulty === 'medium').length,
      hard: validatedQuestions.filter(q => q.difficulty === 'hard').length,
    };
    
    const subtopicsCovered = [...new Set(validatedQuestions.map(q => q.subtopic).filter((s): s is string => !!s))];
    
    console.log('[GeminiQuiz] Generation successful:', {
      requested: config.questionCount,
      generated: validatedQuestions.length,
      difficultyDistribution,
      subtopicsCovered: subtopicsCovered.length,
    });
    
    return {
      questions: validatedQuestions,
      metadata: {
        topic: config.topic,
        generatedCount: validatedQuestions.length,
        difficultyDistribution,
        subtopicsCovered,
      },
    };
    
  } catch (error: any) {
    console.error('[GeminiQuiz] Generation failed:', error.message);
    
    // Get the model name for error messages
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
    
    // Provide helpful error messages
    if (error.message.includes('API_KEY')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
    } else if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('not supported')) {
      throw new Error(`Gemini model "${modelName}" not available. Try using "gemini-1.5-flash" in GEMINI_MODEL_NAME.`);
    } else if (error.message.includes('timeout')) {
      throw new Error('Gemini API request timed out. Please try again.');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits.');
    } else {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}

/**
 * Generate fallback questions when Gemini API is unavailable
 * Uses a curated question bank based on topic
 */
export function generateFallbackQuestions(
  topic: string,
  count: number,
  difficulty: DifficultyLevel | 'mixed'
): QuizQuestion[] {
  console.log('[GeminiQuiz] Generating fallback questions for:', topic);
  
  // Expanded question bank covering all major DSA topics
  const fallbackBank: Record<string, QuizQuestion[]> = {
    'Arrays & Strings': [
      {
        id: 'arrays-1',
        topic: 'Arrays & Strings',
        subtopic: 'Array Basics',
        question: 'What is the time complexity of accessing an element in an array by index?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Array access by index is O(1) because arrays store elements in contiguous memory locations, allowing direct access using the index.',
        points: 10,
      },
      {
        id: 'arrays-2',
        topic: 'Arrays & Strings',
        subtopic: 'Array Operations',
        question: 'What is the time complexity of inserting an element at the beginning of an array?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Inserting at the beginning requires shifting all existing elements by one position, making it O(n).',
        points: 15,
      },
      {
        id: 'arrays-3',
        topic: 'Arrays & Strings',
        subtopic: 'Two Pointers',
        question: 'Which technique is most efficient for finding a pair with a given sum in a sorted array?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Nested loops O(n²)', 'Two pointers O(n)', 'Binary search for each element O(n log n)', 'Hash map O(n) with O(n) space'],
        correctAnswer: 1,
        explanation: 'Two pointers technique achieves O(n) time with O(1) space by moving pointers from both ends based on the current sum.',
        points: 15,
      },
    ],
    'Strings': [
      {
        id: 'strings-1',
        topic: 'Strings',
        subtopic: 'String Basics',
        question: 'Are strings mutable or immutable in most programming languages like Java and Python?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['Mutable', 'Immutable', 'Depends on declaration', 'Both'],
        correctAnswer: 1,
        explanation: 'Strings are immutable in Java, Python, and many other languages. Once created, their content cannot be changed.',
        points: 10,
      },
      {
        id: 'strings-2',
        topic: 'Strings',
        subtopic: 'String Comparison',
        question: 'What is the time complexity of comparing two strings of length n?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'String comparison requires checking each character until a difference is found, making it O(n).',
        points: 15,
      },
    ],
    'Linked Lists': [
      {
        id: 'linkedlist-1',
        topic: 'Linked Lists',
        subtopic: 'Linked List Basics',
        question: 'What is the time complexity of inserting an element at the beginning of a singly linked list?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Inserting at the beginning only requires updating the head pointer and the new node\'s next pointer - O(1).',
        points: 10,
      },
      {
        id: 'linkedlist-2',
        topic: 'Linked Lists',
        subtopic: 'Cycle Detection',
        question: 'Which algorithm is used to detect a cycle in a linked list with O(1) space?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Hash Set', 'Floyd\'s Cycle Detection (Tortoise and Hare)', 'BFS', 'DFS'],
        correctAnswer: 1,
        explanation: 'Floyd\'s algorithm uses two pointers moving at different speeds. If there\'s a cycle, they will meet.',
        points: 15,
      },
      {
        id: 'linkedlist-3',
        topic: 'Linked Lists',
        subtopic: 'Linked List vs Array',
        question: 'When is a linked list preferred over an array?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['When random access is needed', 'When frequent insertions/deletions at arbitrary positions', 'When memory is limited', 'When cache performance is critical'],
        correctAnswer: 1,
        explanation: 'Linked lists excel at insertions/deletions as they don\'t require shifting elements like arrays do.',
        points: 15,
      },
    ],
    'Stacks & Queues': [
      {
        id: 'stack-1',
        topic: 'Stacks & Queues',
        subtopic: 'Stack Basics',
        question: 'Which principle does a stack follow?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['FIFO (First In First Out)', 'LIFO (Last In First Out)', 'Random Access', 'Priority Based'],
        correctAnswer: 1,
        explanation: 'Stacks follow LIFO - the last element added is the first one to be removed.',
        points: 10,
      },
      {
        id: 'stack-2',
        topic: 'Stacks & Queues',
        subtopic: 'Stack Applications',
        question: 'Which data structure is most suitable for implementing undo/redo functionality?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Queue', 'Stack', 'Linked List', 'Array'],
        correctAnswer: 1,
        explanation: 'Stack is ideal for undo/redo as the most recent action (last in) needs to be undone first (first out).',
        points: 15,
      },
      {
        id: 'queue-1',
        topic: 'Stacks & Queues',
        subtopic: 'Queue Basics',
        question: 'What is the time complexity of enqueue and dequeue operations in a properly implemented queue?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(n) for both', 'O(1) for both', 'O(1) enqueue, O(n) dequeue', 'O(n) enqueue, O(1) dequeue'],
        correctAnswer: 1,
        explanation: 'Both enqueue and dequeue are O(1) in a properly implemented queue using linked list or circular array.',
        points: 10,
      },
    ],
    'Trees': [
      {
        id: 'tree-1',
        topic: 'Trees',
        subtopic: 'Binary Tree Basics',
        question: 'What is the maximum number of nodes at level k in a binary tree?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['k', '2k', '2^k', '2^(k+1)'],
        correctAnswer: 2,
        explanation: 'At level k, a binary tree can have at most 2^k nodes (level 0 has 1, level 1 has 2, level 2 has 4, etc.).',
        points: 10,
      },
      {
        id: 'tree-2',
        topic: 'Trees',
        subtopic: 'BST Operations',
        question: 'What is the average time complexity of search in a balanced BST?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 1,
        explanation: 'In a balanced BST, we eliminate half the nodes at each step, giving O(log n) average case.',
        points: 15,
      },
      {
        id: 'tree-3',
        topic: 'Trees',
        subtopic: 'Tree Traversal',
        question: 'Which traversal visits nodes in sorted order for a BST?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Preorder', 'Inorder', 'Postorder', 'Level Order'],
        correctAnswer: 1,
        explanation: 'Inorder traversal (left-root-right) visits BST nodes in ascending sorted order.',
        points: 15,
      },
    ],
    'Graphs': [
      {
        id: 'graph-1',
        topic: 'Graphs',
        subtopic: 'Graph Basics',
        question: 'Which representation is more space-efficient for a sparse graph?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['Adjacency Matrix', 'Adjacency List', 'Edge List', 'Both are equal'],
        correctAnswer: 1,
        explanation: 'Adjacency list uses O(V+E) space, better for sparse graphs where E << V².',
        points: 10,
      },
      {
        id: 'graph-2',
        topic: 'Graphs',
        subtopic: 'Graph Traversal',
        question: 'Which algorithm finds the shortest path in an unweighted graph?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['DFS', 'BFS', 'Dijkstra', 'Bellman-Ford'],
        correctAnswer: 1,
        explanation: 'BFS explores nodes level by level, guaranteeing shortest path in unweighted graphs.',
        points: 15,
      },
      {
        id: 'graph-3',
        topic: 'Graphs',
        subtopic: 'Shortest Path',
        question: 'Which algorithm handles negative edge weights?',
        type: 'multiple-choice',
        difficulty: 'hard',
        options: ['Dijkstra', 'BFS', 'Bellman-Ford', 'A* Search'],
        correctAnswer: 2,
        explanation: 'Bellman-Ford can handle negative weights and detect negative cycles, unlike Dijkstra.',
        points: 20,
      },
    ],
    'Sorting': [
      {
        id: 'sort-1',
        topic: 'Sorting',
        subtopic: 'Sorting Basics',
        question: 'Which sorting algorithm has the best average-case time complexity?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['Bubble Sort O(n²)', 'Quick Sort O(n log n)', 'Selection Sort O(n²)', 'Insertion Sort O(n²)'],
        correctAnswer: 1,
        explanation: 'Quick Sort has O(n log n) average case, making it one of the fastest comparison sorts.',
        points: 10,
      },
      {
        id: 'sort-2',
        topic: 'Sorting',
        subtopic: 'Sorting Stability',
        question: 'Which of these sorting algorithms is stable?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort'],
        correctAnswer: 2,
        explanation: 'Merge Sort is stable - it preserves the relative order of equal elements.',
        points: 15,
      },
      {
        id: 'sort-3',
        topic: 'Sorting',
        subtopic: 'Sorting Choice',
        question: 'Which algorithm is best for nearly sorted data?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Merge Sort', 'Quick Sort', 'Insertion Sort', 'Heap Sort'],
        correctAnswer: 2,
        explanation: 'Insertion Sort runs in O(n) for nearly sorted data as it only needs few swaps.',
        points: 15,
      },
    ],
    'Binary Search': [
      {
        id: 'bsearch-1',
        topic: 'Binary Search',
        subtopic: 'Binary Search Basics',
        question: 'What is the prerequisite for using binary search?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['Array must be of even length', 'Array must be sorted', 'Array must have unique elements', 'Array must have positive numbers'],
        correctAnswer: 1,
        explanation: 'Binary search requires a sorted array to correctly eliminate half the elements at each step.',
        points: 10,
      },
      {
        id: 'bsearch-2',
        topic: 'Binary Search',
        subtopic: 'Binary Search Complexity',
        question: 'What is the time complexity of binary search?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctAnswer: 2,
        explanation: 'Binary search halves the search space each iteration, giving O(log n) complexity.',
        points: 10,
      },
      {
        id: 'bsearch-3',
        topic: 'Binary Search',
        subtopic: 'Binary Search Variants',
        question: 'How do you find the first occurrence of a target in a sorted array with duplicates?',
        type: 'multiple-choice',
        difficulty: 'hard',
        options: ['Standard binary search', 'Binary search + linear scan left', 'Modified binary search continuing left after finding target', 'Linear search'],
        correctAnswer: 2,
        explanation: 'Continue searching in the left half even after finding the target to find the first occurrence.',
        points: 20,
      },
    ],
    'Recursion': [
      {
        id: 'recursion-1',
        topic: 'Recursion',
        subtopic: 'Recursion Basics',
        question: 'What is the essential component that prevents infinite recursion?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['Recursive call', 'Base case', 'Return statement', 'Loop'],
        correctAnswer: 1,
        explanation: 'The base case is essential - it defines when recursion should stop.',
        points: 10,
      },
      {
        id: 'recursion-2',
        topic: 'Recursion',
        subtopic: 'Recursion vs Iteration',
        question: 'What is a disadvantage of recursion compared to iteration?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Harder to understand', 'Uses call stack memory', 'Cannot solve all problems', 'Slower execution always'],
        correctAnswer: 1,
        explanation: 'Each recursive call adds a frame to the call stack, potentially causing stack overflow.',
        points: 15,
      },
    ],
    'Dynamic Programming': [
      {
        id: 'dp-1',
        topic: 'Dynamic Programming',
        subtopic: 'DP Basics',
        question: 'What are the two key properties required for a problem to be solved using DP?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Sorting and searching', 'Overlapping subproblems and optimal substructure', 'Base case and recursive case', 'Time and space efficiency'],
        correctAnswer: 1,
        explanation: 'DP requires overlapping subproblems (same subproblems solved multiple times) and optimal substructure (optimal solution contains optimal solutions to subproblems).',
        points: 15,
      },
      {
        id: 'dp-2',
        topic: 'Dynamic Programming',
        subtopic: 'Memoization vs Tabulation',
        question: 'What is the difference between memoization and tabulation?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Memoization is faster', 'Tabulation uses recursion', 'Memoization is top-down, tabulation is bottom-up', 'They are the same'],
        correctAnswer: 2,
        explanation: 'Memoization (top-down) uses recursion with caching; tabulation (bottom-up) fills a table iteratively.',
        points: 15,
      },
    ],
    'Hash Tables': [
      {
        id: 'hash-1',
        topic: 'Hash Tables',
        subtopic: 'Hash Table Basics',
        question: 'What is the average time complexity of insertion in a hash table?',
        type: 'multiple-choice',
        difficulty: 'easy',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 0,
        explanation: 'Hash tables provide O(1) average case for insert, search, and delete operations.',
        points: 10,
      },
      {
        id: 'hash-2',
        topic: 'Hash Tables',
        subtopic: 'Collision Handling',
        question: 'Which collision resolution technique stores multiple elements at the same index?',
        type: 'multiple-choice',
        difficulty: 'medium',
        options: ['Linear probing', 'Quadratic probing', 'Chaining', 'Double hashing'],
        correctAnswer: 2,
        explanation: 'Chaining uses linked lists at each index to store all elements that hash to the same location.',
        points: 15,
      },
    ],
  };
  
  // Smart topic matching - find best match for the given topic
  const topicLower = topic.toLowerCase();
  let questions: QuizQuestion[] = [];
  
  // Try exact match first
  if (fallbackBank[topic]) {
    questions = [...fallbackBank[topic]];
  } else {
    // Try partial match
    for (const [bankTopic, bankQuestions] of Object.entries(fallbackBank)) {
      const bankTopicLower = bankTopic.toLowerCase();
      if (topicLower.includes(bankTopicLower) || bankTopicLower.includes(topicLower)) {
        questions = [...bankQuestions];
        break;
      }
    }
    
    // Try keyword matching
    if (questions.length === 0) {
      const topicKeywords: Record<string, string[]> = {
        'Arrays & Strings': ['array', 'string', 'two pointer', 'sliding window'],
        'Linked Lists': ['linked', 'list', 'node', 'pointer'],
        'Stacks & Queues': ['stack', 'queue', 'lifo', 'fifo', 'push', 'pop'],
        'Trees': ['tree', 'binary', 'bst', 'traversal', 'inorder', 'preorder'],
        'Graphs': ['graph', 'bfs', 'dfs', 'dijkstra', 'shortest path', 'vertex', 'edge'],
        'Sorting': ['sort', 'quick', 'merge', 'heap', 'bubble', 'insertion'],
        'Binary Search': ['binary search', 'search', 'divide and conquer'],
        'Recursion': ['recursion', 'recursive', 'base case'],
        'Dynamic Programming': ['dynamic', 'dp', 'memoization', 'tabulation', 'subproblem'],
        'Hash Tables': ['hash', 'map', 'dictionary', 'collision', 'key value'],
      };
      
      for (const [bankTopic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(kw => topicLower.includes(kw))) {
          questions = [...fallbackBank[bankTopic]];
          // Update topic name in questions to match user's topic
          questions = questions.map(q => ({ ...q, topic: topic }));
          break;
        }
      }
    }
    
    // Default to Arrays & Strings if no match
    if (questions.length === 0) {
      questions = [...fallbackBank['Arrays & Strings']];
      questions = questions.map(q => ({ ...q, topic: topic }));
    }
  }
  
  // Filter by difficulty if not mixed
  if (difficulty !== 'mixed') {
    const filteredQuestions = questions.filter(q => q.difficulty === difficulty);
    // Only use filtered if we have enough questions
    if (filteredQuestions.length > 0) {
      questions = filteredQuestions;
    }
  }
  
  // Ensure we have enough questions by collecting from other topics if needed
  if (questions.length < count) {
    const allQuestions = Object.values(fallbackBank).flat();
    const additionalQuestions = allQuestions
      .filter(q => !questions.find(eq => eq.id === q.id))
      .map(q => ({ ...q, topic: topic, id: `${q.id}-${topic.replace(/\s+/g, '-')}` }));
    
    // Add more questions
    questions = [...questions, ...additionalQuestions];
  }
  
  // Shuffle questions for variety
  questions = questions.sort(() => Math.random() - 0.5);
  
  // Return requested count with unique IDs
  return questions.slice(0, count).map((q, idx) => ({
    ...q,
    id: `${q.id}-${Date.now()}-${idx}`,
  }));
}

/**
 * Analyze user's answer and provide detailed feedback
 */
export function analyzeAnswer(
  question: QuizQuestion,
  userAnswer: number,
  timeSpent?: number
): {
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: string;
  learningPoints: string[];
} {
  const isCorrect = userAnswer === question.correctAnswer;
  
  // Ensure options exist
  if (!question.options || question.options.length < 4) {
    throw new Error('Invalid question: missing or incomplete options');
  }
  
  // Ensure correctAnswer is a number for multiple choice
  const correctAnswerIndex = typeof question.correctAnswer === 'number' 
    ? question.correctAnswer 
    : parseInt(String(question.correctAnswer), 10);
  
  // Generate feedback based on correctness
  let feedback = '';
  if (isCorrect) {
    feedback = '✅ Correct! Well done!';
  } else {
    const correctOption = question.options[correctAnswerIndex];
    const userOption = question.options[userAnswer];
    feedback = `❌ Incorrect. You selected "${userOption}", but the correct answer is "${correctOption}".`;
  }
  
  // Detailed analysis
  let detailedAnalysis = question.explanation || 'No explanation available.';
  
  if (!isCorrect) {
    detailedAnalysis += `\n\nYour answer: ${question.options[userAnswer]}\nCorrect answer: ${question.options[correctAnswerIndex]}`;
  }
  
  // Extract learning points from explanation
  const learningPoints: string[] = [];
  
  // Add time-based feedback
  if (timeSpent !== undefined) {
    if (timeSpent < 10) {
      learningPoints.push('Take more time to read the question carefully');
    } else if (timeSpent > 120) {
      learningPoints.push('Try to improve your speed while maintaining accuracy');
    }
  }
  
  // Add difficulty-based learning points
  if (!isCorrect) {
    if (question.difficulty === 'easy') {
      learningPoints.push('Review the basic concepts of ' + question.subtopic);
    } else if (question.difficulty === 'medium') {
      learningPoints.push('Practice more problems on ' + question.subtopic);
    } else {
      learningPoints.push('Study advanced topics and edge cases in ' + question.subtopic);
    }
  }
  
  return {
    isCorrect,
    feedback,
    detailedAnalysis,
    learningPoints,
  };
}
