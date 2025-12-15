import { EmotionType } from './utils';

interface SlideContent {
  title: string;
  type: 'concept' | 'example' | 'tip' | 'practice' | 'diagram';
  content: string;
  visualAid?: {
    type: 'diagram' | 'flowchart' | 'illustration';
    data: string;
  };
  keyPoints?: string[];
  example?: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
}

export function generateSlidesFromContent(content: string, topic: string, emotion: EmotionType): SlideContent[] {
  const slides: SlideContent[] = [];
  
  // Parse content into sections
  const sections = content.split('\n\n').filter(s => s.trim());
  
  // First slide: Introduction with visual
  if (sections.length > 0) {
    const introSlide: SlideContent = {
      title: `Understanding ${topic}`,
      type: 'concept',
      content: sections[0],
      keyPoints: extractKeyPoints(sections[0]),
      visualAid: generateVisualAid(topic, 'introduction')
    };
    slides.push(introSlide);
  }
  
  // Second slide: Detailed explanation with diagram
  if (sections.length > 1) {
    const explanationSlide: SlideContent = {
      title: 'How It Works',
      type: 'diagram',
      content: sections[1] || sections[0],
      visualAid: generateDiagramForTopic(topic),
      keyPoints: extractKeyPoints(sections[1] || sections[0])
    };
    slides.push(explanationSlide);
  }
  
  // Third slide: Example
  const exampleSlide: SlideContent = {
    title: 'Real-World Example',
    type: 'example',
    content: 'Let\'s see how this concept applies in practice.',
    example: generateExample(topic),
    keyPoints: ['Practical application', 'Step-by-step process', 'Common scenarios']
  };
  slides.push(exampleSlide);
  
  // Fourth slide: Tips
  const tipsSlide: SlideContent = {
    title: 'Pro Tips & Best Practices',
    type: 'tip',
    content: 'Here are some helpful tips to master this concept:',
    keyPoints: generateTips(topic),
    visualAid: {
      type: 'illustration',
      data: '💡'
    }
  };
  slides.push(tipsSlide);
  
  // Fifth slide: Practice quiz
  const quizSlide: SlideContent = {
    title: 'Test Your Understanding',
    type: 'practice',
    content: 'Let\'s check how well you\'ve understood the concept!',
    quiz: generateQuiz(topic)
  };
  slides.push(quizSlide);
  
  // Simplify for negative emotions
  if (emotion === 'confused' || emotion === 'frustrated') {
    return simplifySlides(slides);
  }
  
  return slides;
}

function extractKeyPoints(text: string): string[] {
  const points: string[] = [];
  
  // Look for bullet points
  const bulletMatches = text.match(/[-•]\s*([^\n]+)/g);
  if (bulletMatches) {
    return bulletMatches.map(m => m.replace(/^[-•]\s*/, '').trim()).slice(0, 4);
  }
  
  // Look for numbered lists
  const numberMatches = text.match(/\d+\.\s*([^\n]+)/g);
  if (numberMatches) {
    return numberMatches.map(m => m.replace(/^\d+\.\s*/, '').trim()).slice(0, 4);
  }
  
  // Extract sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).map(s => s.trim());
}

function generateVisualAid(topic: string, type: string): any {
  // Return null for now, can be enhanced with actual visual generation
  if (type === 'introduction') {
    return {
      type: 'illustration',
      data: getTopicEmoji(topic)
    };
  }
  return undefined;
}

function getTopicEmoji(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('binary') || topicLower.includes('search')) return '🔍';
  if (topicLower.includes('recursion')) return '🔄';
  if (topicLower.includes('economics') || topicLower.includes('diminishing')) return '📊';
  if (topicLower.includes('percentage') || topicLower.includes('profit')) return '💰';
  if (topicLower.includes('oop') || topicLower.includes('object')) return '🎯';
  if (topicLower.includes('gre') || topicLower.includes('quantitative')) return '📐';
  if (topicLower.includes('verbal')) return '📚';
  
  return '📖';
}

function generateDiagramForTopic(topic: string): any {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('binary search')) {
    return {
      type: 'flowchart',
      data: `graph TD
    A[Start: Sorted Array] --> B{Middle Element}
    B -->|Target < Middle| C[Search Left Half]
    B -->|Target > Middle| D[Search Right Half]
    B -->|Target = Middle| E[Found!]
    C --> F{Found?}
    D --> F
    F -->|Yes| E
    F -->|No| G[Not Found]`
    };
  }
  
  if (topicLower.includes('recursion')) {
    return {
      type: 'flowchart',
      data: `graph TD
    A[Function Call] --> B{Base Case?}
    B -->|Yes| C[Return Result]
    B -->|No| D[Make Recursive Call]
    D --> E[Process Result]
    E --> C`
    };
  }
  
  if (topicLower.includes('oop') || topicLower.includes('object')) {
    return {
      type: 'diagram',
      data: `classDiagram
    class Animal {
        +name: string
        +age: number
        +makeSound()
        +move()
    }
    class Dog {
        +breed: string
        +bark()
    }
    class Cat {
        +color: string
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
    };
  }
  
  if (topicLower.includes('economics') || topicLower.includes('diminishing')) {
    return {
      type: 'diagram',
      data: `graph LR
    A[Input 1] --> B[Output: High]
    C[Input 2] --> D[Output: Medium]
    E[Input 3] --> F[Output: Low]
    style B fill:#90EE90
    style D fill:#FFD700
    style F fill:#FFA500`
    };
  }
  
  // Default flowchart
  return {
    type: 'flowchart',
    data: `graph TD
    A[Start] --> B[Learn Concept]
    B --> C[Practice]
    C --> D[Master It]`
  };
}

function generateExample(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('binary search')) {
    return 'Imagine you\'re looking for a word in a dictionary. Instead of checking every page, you open the middle, see if your word comes before or after, and then check only that half. You keep dividing until you find the word!';
  }
  
  if (topicLower.includes('recursion')) {
    return 'Think of Russian nesting dolls. To reach the smallest doll, you open one doll (make a call), then open the next smaller doll (recursive call), and keep going until you reach the smallest one (base case).';
  }
  
  if (topicLower.includes('oop')) {
    return 'Think of a car blueprint (class). From this blueprint, you can create many actual cars (objects). Each car has properties (color, model) and can perform actions (drive, honk).';
  }
  
  if (topicLower.includes('percentage')) {
    return 'If a shirt costs $50 and has a 20% discount, you save $10 (20% of $50). The final price is $40.';
  }
  
  return 'Consider a real-world scenario where you would apply this concept in your daily life.';
}

function generateTips(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('binary search')) {
    return [
      'Always make sure your array is sorted first',
      'Keep track of left and right pointers',
      'Check for edge cases (empty array, single element)',
      'Practice with different data types'
    ];
  }
  
  if (topicLower.includes('recursion')) {
    return [
      'Always define a clear base case',
      'Make sure each recursive call moves toward the base case',
      'Draw out the call stack to visualize',
      'Consider iteration as an alternative'
    ];
  }
  
  return [
    'Practice regularly to build muscle memory',
    'Start with simple examples',
    'Teach the concept to someone else',
    'Apply it to real-world problems'
  ];
}

function generateQuiz(topic: string): any {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('binary search')) {
    return {
      question: 'What is a requirement for binary search to work?',
      options: [
        'The array must be unsorted',
        'The array must be sorted',
        'The array must have duplicates',
        'The array must be empty'
      ],
      correctAnswer: 1,
      explanation: 'Binary search requires a sorted array because it relies on comparing the target with the middle element to decide which half to search next.'
    };
  }
  
  if (topicLower.includes('recursion')) {
    return {
      question: 'What is the base case in recursion?',
      options: [
        'The first recursive call',
        'The condition that stops recursion',
        'The largest input',
        'The most complex case'
      ],
      correctAnswer: 1,
      explanation: 'The base case is the condition that stops the recursion. Without it, the function would call itself indefinitely.'
    };
  }
  
  return {
    question: 'What is the main benefit of understanding this concept?',
    options: [
      'It makes you look smart',
      'It helps solve real problems efficiently',
      'It\'s required for exams only',
        'It has no practical use'
      ],
      correctAnswer: 1,
      explanation: 'Understanding concepts helps you solve real-world problems more efficiently and effectively.'
    };
}

function simplifySlides(slides: SlideContent[]): SlideContent[] {
  // When user is confused/frustrated, simplify the slides
  return slides.map(slide => ({
    ...slide,
    content: simplifyContent(slide.content),
    keyPoints: slide.keyPoints ? slide.keyPoints.slice(0, 2) : [],
    // Keep visual aids but simplify quiz
    quiz: slide.quiz ? {
      ...slide.quiz,
      options: slide.quiz.options.slice(0, 2).concat(['I need more explanation', 'Show me an example'])
    } : undefined
  }));
}

function simplifyContent(content: string): string {
  // Break long sentences into shorter ones
  const sentences = content.split(/[.!?]+/);
  if (sentences.length > 3) {
    return sentences.slice(0, 2).join('. ') + '.';
  }
  return content;
}