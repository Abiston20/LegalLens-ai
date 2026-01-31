
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Maximize2, ExternalLink, Globe } from 'lucide-react';
import { Role, Message } from '../types';
import { chatWithLegalAI } from '../services/geminiService';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.AI,
      content: "Welcome to LEGALLENS. I am your secure legal intelligence engine. How may I assist you with Indian law today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithLegalAI(input, history);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.AI,
        content: response.text || "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
        groundingLinks: response.links
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.AI,
        content: "Network error occurred. Please verify your connection.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-slate-900 px-10 py-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-amber-500/20 transform rotate-3">
            <Maximize2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-serif tracking-tight">LEGALLENS Intelligent Advisor</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">End-to-End Encryption Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/50"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-5 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-100'
            }`}>
              {msg.role === Role.USER ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </div>
            
            <div className={`max-w-[75%] space-y-4 ${msg.role === Role.USER ? 'items-end' : ''}`}>
              <div className={`p-7 rounded-[32px] shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap transition-all ${
                msg.role === Role.USER 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'
              }`}>
                {msg.content}
              </div>
              
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {msg.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {link.title}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  ))}
                </div>
              )}
              
              <div className={`text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ${msg.role === Role.USER ? 'text-right' : ''}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
              <Bot className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-100 p-7 rounded-[32px] rounded-tl-none shadow-sm flex items-center gap-4">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">Synthesizing Legal Logic...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-10 bg-white border-t border-slate-100">
        <div className="relative group max-w-5xl mx-auto">
          <textarea 
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your legal inquiry here... (e.g. 'Draft a reply to a section 138 notice')"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] px-8 py-6 pr-36 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-8 focus:ring-amber-500/5 transition-all resize-none shadow-inner text-base font-medium"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl active:scale-95"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center mt-6 text-slate-400 font-bold uppercase tracking-[0.3em] opacity-50">
          LEGALLENS Intelligent Assurance Engine v2.4
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
