'use client';

import { useState, useEffect } from 'react';
import { Mic, Square, Play, AudioWaveform, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioAnalysis } from '@/hooks/use-audio-analysis';
import { classifyVocalRange, frequencyToNote, VOCAL_RANGES } from '@/lib/audio';
import { Waveform } from '@/components/Waveform';
import { LiveWaveform } from '@/components/LiveWaveform';

export default function Home() {
  const { isRecording, currentFreq, timeLeft, result, analyserNode, startRecording, stopRecording } = useAudioAnalysis();
  const [step, setStep] = useState<'idle' | 'recording' | 'results'>('idle');

  // Ensure result sets step to results
  useEffect(() => {
    if (result && !isRecording) {
      setStep('results');
    }
  }, [result, isRecording]);

  const handleStart = () => {
    setStep('recording');
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleRetry = () => {
    setStep('idle');
  };

  return (
    <div className="w-full h-full bg-[#0a0a0b] text-slate-300 font-sans flex flex-col border-8 border-[#1a1a1c] overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 md:py-8 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-medium tracking-tight text-white">
            SOUND<span className="font-light opacity-50">SORIAL</span>
          </span>
        </div>
        <nav className="hidden md:flex gap-8 text-xs uppercase tracking-[0.2em] font-semibold opacity-60">
          <span className={step === 'idle' ? 'text-indigo-400 opacity-100' : ''}>Dashboard</span>
          <span className={step === 'recording' || step === 'results' ? 'text-indigo-400 opacity-100' : ''}>Vocal Analysis</span>
        </nav>
        <div className="px-4 py-1.5 border border-white/20 rounded-full text-[10px] uppercase tracking-widest hidden sm:block">
          Status: <span className={step === 'recording' ? 'text-rose-400' : 'text-emerald-400'}>{step === 'recording' ? 'Recording' : 'Ready'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center p-6 md:p-12"
            >
              <div className="text-center max-w-2xl">
                <h1 className="text-6xl md:text-8xl font-serif italic text-white tracking-tight mb-6">Analyze Your Range</h1>
                <p className="text-slate-500 leading-relaxed text-sm md:text-base max-w-lg mx-auto mb-10">
                  Discover your true voice. Sing from your lowest comfortable note to your highest, and our acoustic engine will determine your vocal signature.
                </p>
                <button
                  onClick={handleStart}
                  className="px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-slate-200 transition-all active:scale-95 inline-flex items-center gap-3"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Begin Analysis
                </button>

                <div className="mt-24 grid grid-cols-2 md:grid-cols-5 gap-3 opacity-60">
                  {VOCAL_RANGES.map((r, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{r.name}</div>
                      <div className="text-xs font-mono text-white/50">{frequencyToNote(r.min)} - {frequencyToNote(r.max)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
              
              <div className="space-y-4 text-center mb-12 relative z-10">
                <div className="flex justify-center items-center space-x-3 text-rose-400 mb-8">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Acoustic Engine Active // {timeLeft}s</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-serif italic text-white tracking-tight">Sing Low to High</h2>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">Sustain your lowest note, then slowly slide up to your highest possible pitch.</p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 md:p-12 w-full max-w-2xl bg-white/5 rounded-3xl border border-white/5 relative z-10">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Current Frequency</div>
                <div className="text-6xl md:text-8xl font-mono tracking-tighter text-indigo-400 mb-2 font-light">
                  {currentFreq > 0 ? Math.round(currentFreq) : '--'}
                  <span className="text-3xl text-indigo-400/50 ml-2">Hz</span>
                </div>
                <div className="text-2xl text-slate-300 font-mono mb-8">
                  {currentFreq > 0 ? frequencyToNote(currentFreq) : 'Awaiting signature...'}
                </div>
                
                {analyserNode && (
                  <div className="w-full mt-4">
                    <LiveWaveform analyser={analyserNode} color="#818cf8" />
                  </div>
                )}
              </div>
              
              <div className="mt-12 relative z-10 w-full max-w-sm flex flex-col items-center">
                <div className="w-full h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-rose-500" 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 40) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
                <button
                  onClick={handleStop}
                  className="px-8 py-4 bg-rose-500 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-rose-400 transition-all active:scale-95 inline-flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop Analysis Early
                </button>
              </div>
            </motion.div>
          )}

          {step === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {(() => {
                const classification = classifyVocalRange(result.minFreq, result.maxFreq);
                return (
                  <>
                    <div className="px-6 py-6 md:px-12 md:py-12 flex flex-col lg:flex-row justify-between items-start gap-12">
                      <div className="space-y-4 max-w-lg">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-bold">Classification Result</p>
                        <h1 className="text-6xl md:text-8xl font-serif italic text-white tracking-tight">{classification.name}</h1>
                        <p className="text-slate-500 leading-relaxed text-sm">
                          {classification.description} Your vocal profile has been analyzed and classified based on the acoustic signature you provided.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4 w-full lg:w-auto shrink-0">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-1 w-full lg:w-44">
                          <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Lowest Pitch</span>
                          <span className="text-2xl font-mono text-white tracking-tight">{result.minFreq} Hz</span>
                          <span className="text-[10px] text-slate-500 uppercase">{frequencyToNote(result.minFreq)}</span>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-1 w-full lg:w-44">
                          <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Highest Pitch</span>
                          <span className="text-2xl font-mono text-white tracking-tight">{result.maxFreq} Hz</span>
                          <span className="text-[10px] text-slate-500 uppercase">{frequencyToNote(result.maxFreq)}</span>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-1 w-full lg:w-44">
                          <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Total Range</span>
                          <span className="text-2xl font-mono text-white tracking-tight">{Math.round(result.maxFreq - result.minFreq)} Hz</span>
                          <span className="text-[10px] text-indigo-400 uppercase">Frequency Delta</span>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-1 w-full lg:w-44">
                          <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Confidence</span>
                          <span className="text-2xl font-mono text-white tracking-tight">High</span>
                          <span className="text-[10px] text-emerald-500 uppercase">Optimal Sample</span>
                        </div>
                      </div>
                    </div>

                    {/* Waveform Visualization section mimicking the design */}
                    <div className="mt-auto mb-8 px-6 md:px-12 flex-1 flex flex-col justify-end">
                      <div className="flex justify-between items-end mb-6">
                        <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Acoustic Signature Waveform</h3>
                        <div className="flex gap-4 text-[10px] font-mono text-white/30 hidden sm:flex">
                          <span>0.0s</span>
                          <span>Start</span>
                          <span>End</span>
                        </div>
                      </div>
                      
                      <div className="w-full">
                         <Waveform data={result.waveform} color="#6366f1" />
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
        <div className="flex flex-col sm:flex-row sm:gap-6 text-[10px] uppercase tracking-widest text-white/40">
          <span>© {new Date().getFullYear()} SoundSorial AI</span>
          <span className="hidden sm:inline">Engine v2.4.0-stable</span>
        </div>
        
        {step === 'results' && (
           <button 
             onClick={handleRetry}
             className="px-6 md:px-8 py-3 bg-white text-black text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-slate-200 transition-colors"
           >
             New Analysis
           </button>
        )}
      </footer>
    </div>
  );
}

