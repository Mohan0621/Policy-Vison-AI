import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User, Sparkles, Loader2, Info } from 'lucide-react';
import { apiClient, IndianLanguage, QAMessage, VisualStyle } from '../api/client';

interface QAPageProps {
  currentLanguage: IndianLanguage;
  currentStyle: VisualStyle;
}

export const QAPage: React.FC<QAPageProps> = ({ currentLanguage, currentStyle }) => {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.qa.getHistory();
      if (res.success && res.data) {
        setMessages(res.data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    setErrorMsg(null);
    setIsLoading(true);

    // Optimistically add user message
    const newMsg: QAMessage = {
      role: 'user',
      content: q,
      citations: [],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await apiClient.qa.ask(q, currentStyle, currentLanguage);
      if (res.success && res.data) {
        const assistantMsg: QAMessage = {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setErrorMsg(res.error?.message || 'Failed to get answer.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await apiClient.qa.clearHistory();
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex items-end justify-between pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 border border-orange-200 rounded-full px-3 py-1 bg-orange-50 mb-2 shadow-sm">
            <Sparkles size={12} className="text-orange-500" />
            <span>RAG-GROUNDED ASSISTANT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Policy Intelligence Chat<span className="text-orange-500">.</span>
          </h2>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-xs text-slate-600 hover:text-rose-600 flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-rose-300 transition-all shadow-sm font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* 30-min Inactivity context notice */}
      <div className="bg-white rounded-2xl px-4 py-2.5 mb-6 text-xs text-slate-600 flex items-center space-x-2.5 border border-slate-200 shadow-sm">
        <Info className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <span>CONTEXT WINDOW: 10 FIFO SLOTS • 30-MINUTE INACTIVITY PURGE ENFORCED</span>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl mb-6 border border-rose-200 flex items-center space-x-2 shadow-sm">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4 text-orange-600 shadow-sm">
              <Bot className="w-8 h-8 opacity-80" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">
              Ready to Answer Questions
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              Inquire about cashless hospital networks, copayment sub-limits, specific exclusion clauses, or emergency pre-authorization rules.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>

                {m.citations && m.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                      Grounding Passages ({m.citations.length})
                    </div>
                    {m.citations.map((c, ci) => (
                      <div
                        key={ci}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                      >
                        <div className="font-semibold text-orange-600 mb-0.5">
                          {c.section_heading} • Page {c.page_number} ({(c.relevance_score * 100).toFixed(0)}% Match)
                        </div>
                        <div className="italic text-slate-600">"{c.passage_text}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm text-xs text-slate-500 flex items-center space-x-2">
              <span>Retrieving relevant policy clauses & synthesizing answer...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="mt-4 relative flex items-center">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask a question about coverage, claims, or waiting periods..."
          disabled={isLoading}
          className="w-full bg-white border border-slate-300 rounded-2xl py-4 pl-5 pr-14 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 shadow-sm transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuestion.trim()}
          className="absolute right-2 p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-2xs hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
