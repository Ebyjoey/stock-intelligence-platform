import { NextRequest } from 'next/server';
import { chatbotService } from '@/services/chatbot/chat.service';

export const runtime = 'edge'; // Edge runtime for ultra-low streaming latency

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // Request streaming response from ChatbotService
    const openaiStream = await chatbotService.getStreamingResponse(messages, lastMessage);

    // If a Web ReadableStream was returned (e.g. offline fallback simulation stream)
    if (openaiStream instanceof ReadableStream) {
      return new Response(openaiStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // Convert OpenAI async generator stream to standard response stream
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of openaiStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (streamErr) {
          console.error('Error during OpenAI stream extraction:', streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error during chatbot completion.', details: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
