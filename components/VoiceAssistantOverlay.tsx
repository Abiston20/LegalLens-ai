import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { X, Mic, MicOff, PhoneOff, Volume2, Shield, Activity, BrainCircuit, Loader2 } from 'lucide-react';
import { UserProfile, Language } from '../types';

interface VoiceAssistantOverlayProps {
  user: UserProfile;
  language: Language;
  onClose: () => void;
  onTranscriptComplete?: (text: string) => void;
}

// Manual Base64 Implementation
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

const VoiceAssistantOverlay: React.FC<VoiceAssistantOverlayProps> = ({ user, language, onClose, onTranscriptComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userInputTranscript, setUserInputTranscript] = useState('');
  const [aiOutputTranscript, setAiOutputTranscript] = useState('');
  const [status, setStatus] = useState<'Connecting' | 'Listening' | 'Speaking' | 'Ready'>('Connecting');
  
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Track transcription globally in component to send on turn complete
  const currentInputTranscription = useRef('');

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Ready');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output Processing
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('Speaking');
              if (audioContextsRef.current) {
                const { output: ctx } = audioContextsRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus('Listening');
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            }

            // User Input Transcription Handling
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscription.current += text;
              setUserInputTranscript(currentInputTranscription.current);
            }

            // AI Output Transcription Handling
            if (message.serverContent?.outputTranscription) {
              setAiOutputTranscript(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }

            // Turn Completion - Send text to Consultation Engine
            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current.trim() && onTranscriptComplete) {
                onTranscriptComplete(currentInputTranscription.current.trim());
              }
              currentInputTranscription.current = '';
              setUserInputTranscript('');
              setAiOutputTranscript('');
              setStatus('Listening');
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('Listening');
            }
          },
          onerror: (e) => console.error("Live API Error:", e),
          onclose: () => cleanup()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction: `You are LegalLens Voice Assistant. Fast and professional.
          Help ${user.name || 'user'} with legal matters in India. 
          CRITICAL: Respond and listen in ${language}.
          Be concise. No long preambles. Get straight to the point.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to initiate voice session:", err);
      onClose();
    }
  };

  const cleanup = () => {
    setIsActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextsRef.current) {
      const { input, output } = audioContextsRef.current;
      if (input.state !== 'closed') {
        input.close().catch(() => {});
      }
      if (output.state !== 'closed') {
        output.close().catch(() => {});
      }
      audioContextsRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
  };

  useEffect(() => {
    startSession();
    return () => cleanup();
  }, []);

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-12">
        <div className="w-full flex justify-between items-center text-white/40 px-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] font-serif">Secure Voice Hub</span>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative group">
          <div className={`absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full transition-all duration-1000 ${status === 'Speaking' ? 'scale-150 opacity-100 bg-amber-500/30' : 'scale-100 opacity-50'}`}></div>
          <div className={`w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-white/5 flex items-center justify-center relative z-10 transition-all duration-500 ${status === 'Speaking' ? 'border-amber-500/40' : 'border-indigo-500/20'}`}>
            <div className={`absolute inset-4 rounded-full border border-white/5 animate-spin-slow`}></div>
            <div className={`w-36 h-36 md:w-48 md:h-48 rounded-[60px] flex flex-col items-center justify-center gap-4 transition-all duration-500 ${status === 'Speaking' ? 'bg-amber-500 scale-105 shadow-[0_0_60px_rgba(245,158,11,0.4)]' : 'bg-slate-900 shadow-2xl'}`}>
              {status === 'Speaking' ? <Volume2 className="w-14 h-14 text-slate-950 animate-pulse" /> : <Activity className="w-14 h-14 text-indigo-500" />}
            </div>
          </div>
        </div>

        <div className="space-y-6 px-12 w-full">
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-white font-serif text-4xl font-bold tracking-tight">LegalLens Live</h3>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className={`w-2 h-2 rounded-full ${status === 'Connecting' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.4em]">{status} in {language}</p>
            </div>
          </div>
          
          <div className="min-h-[120px] flex flex-col items-center justify-center space-y-4">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 w-full">
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60">Spoken Query</p>
              <p className="text-slate-200 text-lg font-medium leading-relaxed italic">
                {userInputTranscript || (status === 'Listening' ? "Waiting for your input..." : "---")}
              </p>
            </div>
            {aiOutputTranscript && (
              <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/10 w-full animate-in fade-in slide-in-from-bottom-2">
                 <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60">AI Output</p>
                 <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                   {aiOutputTranscript}
                 </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-10 relative z-20">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={onClose}
            className="w-24 h-24 bg-red-600 text-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-red-600/40 hover:bg-red-700 hover:scale-110 active:scale-95 transition-all"
          >
            <PhoneOff className="w-10 h-10" />
          </button>

          <button className="w-16 h-16 bg-white/10 text-white rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all">
            <BrainCircuit className="w-6 h-6" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VoiceAssistantOverlay;