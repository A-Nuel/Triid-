import { useState, useRef, useCallback } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Microphone access denied or unavailable.");
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        audioChunks.current = [];
        mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
        mediaRecorder.current = null;
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorder.current = null;
    }
    audioChunks.current = [];
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
