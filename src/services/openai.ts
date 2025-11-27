import type { Task } from '../types';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateTasks(projectIdea: string): Promise<Task[]> {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not configured. Please check your environment variables.');
  }

  const systemPrompt = `You are a GTD (Getting Things Done) productivity expert. Given a project idea, break it down into clear, actionable tasks following GTD methodology.

Guidelines:
- Each task should be a specific, actionable next step
- Tasks should be ordered logically (dependencies first)
- Each task should be achievable in one sitting
- Use clear, action-oriented language (start with verbs)
- Include 5-10 tasks that cover the full project scope

Respond with a JSON array of tasks in this format:
[
  {"title": "Task title", "description": "Optional brief description"},
  ...
]

Only respond with valid JSON, no additional text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Project idea: ${projectIdea}` },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsedTasks = JSON.parse(content);

    if (!Array.isArray(parsedTasks)) {
      throw new Error('Invalid response format');
    }

    return parsedTasks.map((task: { title: string; description?: string }, index: number) => ({
      id: crypto.randomUUID(),
      title: task.title,
      description: task.description,
      completed: false,
      order: index,
    }));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse OpenAI response');
    }
    throw error;
  }
}
