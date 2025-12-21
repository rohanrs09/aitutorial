import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sanitizeMermaidCode, validateMermaidCode } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, type = 'mermaid', description = '' } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'No topic provided' },
        { status: 400 }
      );
    }

    // Generate Mermaid diagram code using GPT-4
    const mermaidCode = await generateMermaidDiagram(topic, description);

    // Fallback: Generate image if Mermaid fails
    let imageUrl = null;
    if (type === 'image') {
      imageUrl = await generateDiagramImage(topic, description);
    }

    return NextResponse.json({
      mermaid: mermaidCode,
      imageUrl: imageUrl,
      success: true,
    });
  } catch (error: any) {
    console.error('Diagram Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Diagram generation failed' },
      { status: 500 }
    );
  }
}

// Generate Mermaid diagram code
async function generateMermaidDiagram(topic: string, description: string): Promise<string> {
  const prompt = `Generate a Mermaid diagram for the following topic: "${topic}".
${description ? `Additional context: ${description}` : ''}

Requirements:
- Use Mermaid version 10.x syntax
- Keep it simple and educational
- Use flowchart, class diagram, or graph as appropriate
- Avoid complex styling
- Make it clear for students
- Do NOT use HTML tags, special characters, or brackets inside node labels
- Use simple alphanumeric text for node labels
- Avoid using symbols like <, >, {, }, $, @, or #

Return ONLY the Mermaid code, no explanations or markdown code blocks.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at creating educational diagrams using Mermaid syntax. Always use Mermaid 10.x compatible syntax. Never include HTML tags or special characters that might break parsing. Return only raw Mermaid code without markdown wrappers.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 800,
  });

  let mermaidCode = completion.choices[0].message.content || '';
  
  // Clean up the response and sanitize
  mermaidCode = mermaidCode.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
  
  // Apply sanitization to fix any remaining issues
  const sanitizedCode = sanitizeMermaidCode(mermaidCode);
  
  // Validate the code
  const validation = validateMermaidCode(sanitizedCode);
  if (!validation.valid) {
    console.warn('Generated Mermaid code validation warning:', validation.error);
    // Return a simple fallback diagram
    return `flowchart TD
    A[${topic}] --> B[Key Concept 1]
    A --> C[Key Concept 2]
    B --> D[Detail]
    C --> E[Detail]`;
  }
  
  return sanitizedCode;
}

// Generate diagram as image using DALL-E (fallback)
async function generateDiagramImage(topic: string, description: string): Promise<string> {
  const prompt = `Create a simple, clear educational diagram about "${topic}". ${description}. 
Style: Clean, minimalist, suitable for students. Use arrows, boxes, and labels.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  return response.data?.[0]?.url || '';
}
