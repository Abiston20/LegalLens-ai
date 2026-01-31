
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Maximize2, ExternalLink, Globe, ChevronDown, BookOpen, BrainCircuit } from 'lucide-react';
import { Role, Message, Language, Jurisdiction } from '../types';
import { chatWithLegalAI } from '../services/geminiService';
import { apiRequest } from '../services/apiService';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>(Jurisdiction.UNION);
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await apiRequest('/legal/chat');
        if (history && history.length > 0) {
          setMessages(history.map((m: any) => ({
            ...m,
            role: m.role as Role,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
          })));
        } else {
          setMessages([{
            id: 'welcome',
            role: Role.AI,
            content: "Welcome to LEGALLENS. I am your secure legal intelligence engine. I now support Civil, Commercial, and Criminal law across multiple Indian jurisdictions. How may I assist you today?",
            timestamp: new Date()
          }]);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleReasoning = (id: string) => {
    setShowReasoning(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      const response = await chatWithLegalAI(input, history, selectedLanguage, selectedJurisdiction);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.AI,
        content: response.text || "I apologize, I couldn't generate a response.",
        reasoning: response.reasoning,
        timestamp: new Date(),
        groundingLinks: response.links.map((l: any) => ({ title: l.web.title, uri: l.web.uri }))
      };

      setMessages(prev => [...prev, aiMessage]);

      await apiRequest('/legal/chat', {
        method: 'POST',
        body: JSON.stringify({
          query_text: input,
          response_text: aiMessage.content
        })
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: Role.AI,
        content: "An error occurred while connecting to the legal engine.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
      {/* Dynamic Header with Controls */}
      <div className="bg-slate-900 px-6 py-6 md:px-10 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-amber-500/20 transform rotate-3 shrink-0">
            <Maximize2 className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">LEGALLENS Advisor</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-Jurisdictional Core Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="appearance-none bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 pr-8 rounded-xl border border-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              {Object.values(Language).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>

          {/* Jurisdiction Selector */}
          <div className="relative">
            <select 
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value as Jurisdiction)}
              className="appearance-none bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 pr-8 rounded-xl border border-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              {Object.values(Jurisdiction).map(jur => (
                <option key={jur} value={jur}>{jur}</option>
              ))}
            </select>
            <BookOpen className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/50 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 md:gap-5 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-100'
            }`}>
              {msg.role === Role.USER ? <User className="w-5 h-5 md:w-6 md:h-6" /> : <Bot className="w-5 h-5 md:w-6 md:h-6" />}
            </div>
            <div className={`max-w-[85%] md:max-w-[75%] space-y-3 ${msg.role === Role.USER ? 'items-end' : ''}`}>
              <div className={`p-5 md:p-7 rounded-[28px] md:rounded-[32px] shadow-sm text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap ${
                msg.role === Role.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'
              }`}>
                {msg.content}

                {/* XAI Reasoning Toggle */}
                {msg.role === Role.AI && msg.reasoning && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => toggleReasoning(msg.id)}
                      className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      {showReasoning[msg.id] ? 'Hide Legal Logic' : 'Explain Logic (XAI)'}
                    </button>
                    {showReasoning[msg.id] && (
                      <div className="mt-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed animate-in slide-in-from-top-2">
                        <p className="font-bold mb-1 uppercase text-[9px] tracking-wider opacity-60">Neural Reasoning Path:</p>
                        {msg.reasoning}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.groundingLinks.map((link, idx) => (
                    <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                      <Globe className="w-3 h-3" />
                      {link.title}
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  ))}
                </div>
              )}
              
              <div className={`text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ${msg.role === Role.USER ? 'text-right' : ''}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 md:gap-5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm"><Bot className="w-5 h-5 md:w-6 md:h-6 text-amber-500 animate-pulse" /></div>
            <div className="bg-white border border-slate-100 p-5 md:p-7 rounded-[28px] md:rounded-[32px] rounded-tl-none shadow-sm flex items-center gap-4">
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-amber-500" />
              <span className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">Processing Multilingual Logic...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-10 bg-white border-t border-slate-100">
        <div className="relative group max-w-5xl mx-auto">
          <textarea 
            rows={1} 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
            placeholder="Describe your legal matter..." 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] md:rounded-[32px] px-6 py-4 md:px-8 md:py-6 pr-20 md:pr-36 focus:outline-none focus:border-amber-500 focus:bg-white transition-all resize-none shadow-inner text-sm md:text-base font-medium" 
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-slate-900 text-white p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl active:scale-95">
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
