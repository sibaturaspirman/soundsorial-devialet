import { useState, useRef, useCallback } from 'react';
import { autoCorrelate } from '@/lib/audio';

export interface AudioAnalysisResult {
  minFreq: number;
  maxFreq: number;
  waveform: number[];
  frequencies: number[];
}

export function useAudioAnalysis() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentFreq, setCurrentFreq] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(40);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  
  // Storage for the active recording session
  const waveformDataRef = useRef<number[]>([]);
  const frequencyDataRef = useRef<number[]>([]);

  const stopRecording = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsRecording(false);
    setCurrentFreq(0);
    setAnalyserNode(null);
    
    // Process final results
    const freqs = frequencyDataRef.current;
    if (freqs.length > 0) {
      // Sort and take trimmed min/max (ignoring top/bottom 5% outliers)
      const sorted = [...freqs].sort((a, b) => a - b);
      const minIndex = Math.floor(sorted.length * 0.05);
      const maxIndex = Math.floor(sorted.length * 0.95);
      
      const minFreq = sorted[minIndex] || sorted[0];
      const maxFreq = sorted[maxIndex] || sorted[sorted.length - 1];
      
      setResult({
        minFreq: Math.round(minFreq),
        maxFreq: Math.round(maxFreq),
        waveform: [...waveformDataRef.current],
        frequencies: [...freqs],
      });
    }
    
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      
      // Reset tracking
      waveformDataRef.current = [];
      frequencyDataRef.current = [];
      setResult(null);
      setIsRecording(true);
      setTimeLeft(40);
      
      // Stop automatically after 40 seconds
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      
      // Start analysis loop
      const updatePitch = () => {
        analyser.getFloatTimeDomainData(dataArray);
        
        // Downsample visual waveform to save memory overhead
        let maxVal = 0;
        for(let i=0; i<dataArray.length; ++i) {
          if (Math.abs(dataArray[i]) > maxVal) {
             maxVal = Math.abs(dataArray[i]);
          }
        }
        
        // Throttle pushing into waveform slightly to prevent immense arrays
        if (waveformDataRef.current.length < 5000) { 
           waveformDataRef.current.push(maxVal);
        }

        const freq = autoCorrelate(dataArray, audioCtx.sampleRate);
        if (freq !== -1) {
           setCurrentFreq(freq);
           frequencyDataRef.current.push(freq);
        } else {
           setCurrentFreq(0);
        }
        
        requestRef.current = requestAnimationFrame(updatePitch);
      };
      
      updatePitch();
    } catch (err) {
      console.error('Error starting audio recording:', err);
      // Can't access mic, probably need to show alert
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  return {
    isRecording,
    currentFreq,
    timeLeft,
    result,
    analyserNode,
    startRecording,
    stopRecording,
  };
}
