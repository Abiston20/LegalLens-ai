
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Loader2, Maximize2, ExternalLink, Globe, ChevronDown, BookOpen, BrainCircuit, Play, Youtube, Mic, Volume2 } from 'lucide-react';
import { Role, Message, Language, Jurisdiction, UserProfile, UserType } from '../types';
import { chatWithLegalAIStream, generateLegalSpeech } from '../services/geminiService';
import { apiRequest, subscribeToTable } from '../services/apiService';
import VoiceAssistantOverlay from './VoiceAssistantOverlay';

// PCM Decoding helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>(Jurisdiction.UNION);
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({});
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const history = await apiRequest('/legal/chat') as any;
      if (history && history.length > 0) {
        setMessages(history.map((m: any) => ({
          ...m,
          role: m.role as Role,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
        })));
      } else if (messages.length === 0) {
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
  }, [messages.length]);

  useEffect(() => {
    const session = localStorage.getItem('legallens_session');
    if (session) {
      const profile = JSON.parse(session);
      setUserProfile(profile);
      if (profile.preferences?.language) setSelectedLanguage(profile.preferences.language);
      if (profile.preferences?.jurisdiction) setSelectedJurisdiction(profile.preferences.jurisdiction);
    }
    fetchHistory();
    
    // Reactive subscription to chat history
    const subscription = subscribeToTable('/legal/chat', fetchHistory);
    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleReasoning = (id: string) => {
    setShowReasoning(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpeak = async (message: Message) => {
    if (isSpeakingId) return;
    setIsSpeakingId(message.id);
    try {
      const base64Audio = await generateLegalSpeech(message.content);
      if (!base64Audio) throw new Error("No audio generated");
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeakingId(null);
      source.start();
    } catch (e) {
      console.error("TTS Failure:", e);
      setIsSpeakingId(null);
    }
  };

  const performChat = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: Role.AI,
      content: "",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, initialAiMessage]);

    try {
      const currentHistory = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      
      const response = await chatWithLegalAIStream(
        text, 
        currentHistory, 
        selectedLanguage, 
        selectedJurisdiction,
        (chunkText) => {
          // Reactive UI Update: Stream the text as it arrives
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: chunkText } : m));
        }
      );
      
      const finalAiMessage: Message = {
        id: aiMessageId,
        role: Role.AI,
        content: response.fullText,
        reasoning: response.reasoning,
        youtubeLinks: response.youtubeLinks,
        timestamp: new Date(),
        groundingLinks: response.links.map((l: any) => ({ title: l.web.title, uri: l.web.uri }))
      };

      setMessages(prev => prev.map(m => m.id === aiMessageId ? finalAiMessage : m));

      // Persist the full exchange to the vault
      await apiRequest('/legal/chat', {
        method: 'POST',
        body: JSON.stringify({
          query_text: text,
          response_text: finalAiMessage.content
        })
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => m.id === aiMessageId ? {
        ...m,
        content: "An error occurred while connecting to the legal engine.",
      } : m));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, selectedLanguage, selectedJurisdiction]);

  const handleSend = () => performChat(input);

  const handleTranscriptResult = (text: string) => {
    performChat(text);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
      {isVoiceOverlayOpen && userProfile && (
        <VoiceAssistantOverlay 
          user={userProfile} 
          language={selectedLanguage}
          onClose={() => setIsVoiceOverlayOpen(false)} 
          onTranscriptComplete={handleTranscriptResult}
        />
      )}

      <div className="bg-slate-900 px-6 py-6 md:px-10 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-amber-500/20 transform rotate-3 shrink-0">
            <Maximize2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">Consultation Engine</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multimedia Grounding Enabled</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <button 
            onClick={() => setIsVoiceOverlayOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-95"
          >
            <Mic className="w-4 h-4" />
            Voice Mode
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/50 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 md:gap-5 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-100'
            }`}>
              {msg.role === Role.USER ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[85%] md:max-w-[75%] space-y-3 ${msg.role === Role.USER ? 'items-end' : ''}`}>
              <div className={`p-5 md:p-7 rounded-[28px] md:rounded-[32px] shadow-sm text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap relative ${
                msg.role === Role.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'
              }`}>
                {msg.content || (msg.role === Role.AI && <Loader2 className="w-5 h-5 animate-spin text-amber-500" />)}

                {msg.role === Role.AI && msg.content && (
                  <button 
                    onClick={() => handleSpeak(msg)}
                    className={`absolute -right-12 top-0 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm transition-all ${isSpeakingId === msg.id ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-slate-400 hover:text-indigo-600'}`}
                    title="Listen to response"
                  >
                    {isSpeakingId === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}

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
                      <div className="mt-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                        {msg.reasoning}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {msg.youtubeLinks && msg.youtubeLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm">
                    <Youtube className="w-3.5 h-3.5" />
                    YouTube Explainer
                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                  </a>
                ))}
                {msg.groundingLinks && msg.groundingLinks.map((link, idx) => (
                  <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                    <Globe className="w-3.5 h-3.5" />
                    {link.title}
                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                  </a>
                ))}
              </div>
              
              <div className={`text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ${msg.role === Role.USER ? 'text-right' : ''}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].content === "" && (
          <div className="flex gap-3 md:gap-5">
            <div className="w-10 h-10 bg-white flex items-center justify-center border border-slate-100 shadow-sm"><Bot className="w-5 h-5 text-amber-500 animate-pulse" /></div>
            <div className="bg-white border border-slate-100 p-5 rounded-[28px] rounded-tl-none shadow-sm flex items-center gap-4">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Synthesizing Case Media...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-10 bg-white border-t border-slate-100">
        <div className="relative group max-w-5xl mx-auto">
          <textarea 
            rows={1} 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
            placeholder="Describe your legal matter or mention a landmark case..." 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] px-8 py-6 pr-20 focus:outline-none focus:border-amber-500 focus:bg-white transition-all resize-none shadow-inner text-sm font-medium" 
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <button 
              onClick={() => setIsVoiceOverlayOpen(true)}
              className="p-4 text-slate-400 hover:text-amber-500 transition-colors"
              title="Voice Assistant"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl active:scale-95">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
