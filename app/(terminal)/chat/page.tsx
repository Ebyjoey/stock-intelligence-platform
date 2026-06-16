'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  MessageSquareCode, 
  Trash2, 
  Sparkles, 
  HelpCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import Markdown from '@/components/chat/markdown';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || searchParams.get('query');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `### Welcome to QUANT_INTELLIGENCE // Terminal Chat

Enter a ticker symbol (e.g. \`TSLA\`, \`AAPL\`) or ask analytical questions to retrieve live pricing data, moving averages, relative strength indexes, and consolidated news sentiments.

*Use suggested templates below for rapid reviews:*
- "Analyze Apple stock profile"
- "Compare Nvidia and Tesla technicals"
- "Why is Nifty falling today?"`
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load template query from dashboard url if provided
  useEffect(() => {
    if (queryParam) {
      triggerSearch(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const triggerSearch = async (text: string) => {
    if (!text.trim() || isGenerating) return;
    
    setInput('');
    const userMessage: Message = { role: 'user', content: text };
    const activeMessages = [...messages, userMessage];
    setMessages(activeMessages);
    setIsGenerating(true);

    // Create a temporary assistant state for streaming text
    const assistantIndex = activeMessages.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: activeMessages }),
      });

      if (!response.ok) {
        throw new Error('API server returned error completion.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          streamText += chunk;

          // Update active message chunk
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex].content = streamText;
            }
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Streaming API error:', err);
      setMessages(prev => {
        const next = [...prev];
        if (next[assistantIndex]) {
          next[assistantIndex].content = `### Network Error\n\nFailed to establish connection to OpenAI stream router. Please ensure your environment credentials (e.g. \`OPENAI_API_KEY\`) are properly configured.`;
        }
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(input);
  };

  const clearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: `### Quant Intelligence Session Cleared\n\nSubmit new market queries to restart the session profile.`
      }
    ]);
  };

  const suggestions = [
    { title: 'Analyze AAPL', prompt: 'Analyze Apple stock.' },
    { title: 'Compare TSLA vs NVDA', prompt: 'Compare Tesla and Nvidia.' },
    { title: 'Explain RSI Indicator', prompt: 'Explain RSI technical indicator.' },
    { title: 'Market Sentiment', prompt: 'Summarize today\'s overall market sentiment.' }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground font-sans">
      {/* Top Header Section */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquareCode className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wide uppercase">QUANT_CHAT_ASSISTANT</h2>
            <p className="text-[10px] text-neutral">OpenAI GPT-4o grounded in live financial feeds.</p>
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-[10px] font-mono hover:bg-accent text-neutral hover:text-loser transition"
          title="Clear Session"
        >
          <Trash2 className="w-3.5 h-3.5" />
          CLEAR_SESSION
        </button>
      </div>

      {/* Main Messages Body Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index} 
                className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded border border-border bg-card shrink-0 flex items-center justify-center font-mono text-xs font-bold text-primary">
                    QI
                  </div>
                )}
                
                <div className={`rounded p-4 max-w-[85%] border ${
                  isUser 
                    ? 'bg-accent/60 border-border/80 text-foreground' 
                    : 'bg-card border-border/40 text-foreground'
                }`}>
                  {isUser ? (
                    <p className="text-xs font-mono">{msg.content}</p>
                  ) : (
                    <Markdown content={msg.content || 'Generating Response...'} />
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded bg-primary/20 border border-primary/20 shrink-0 flex items-center justify-center font-mono text-xs font-bold text-primary">
                    TR
                  </div>
                )}
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded border border-border bg-card shrink-0 flex items-center justify-center font-mono text-xs font-bold text-primary">
                QI
              </div>
              <div className="rounded p-4 bg-card border border-border/40 flex items-center gap-2">
                <span className="terminal-cursor"></span>
                <span className="text-[10px] font-mono text-neutral">Fetching live context & compiling prompt...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions / Quick Prompts Footer bar */}
      <div className="border-t border-border bg-card p-4 shrink-0">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.title}
                  onClick={() => triggerSearch(s.prompt)}
                  className="px-3 py-1.5 bg-background border border-border hover:border-primary/50 text-[10px] font-mono text-neutral hover:text-foreground rounded transition"
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}

          {/* Form Input Submit segment */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask terminal, e.g. Analyze NVDA stock..."
              className="flex-1 bg-background border border-border focus:border-primary text-xs rounded px-4 py-3 font-mono focus:outline-none focus:ring-0"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="px-5 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded flex items-center justify-center transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center font-mono text-xs text-neutral">
        Initializing Quant Chat Terminal...
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
