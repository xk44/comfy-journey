import React, { useState, useRef } from 'react';
import voiceService from '../services/voiceService';

const VoiceInput = ({ onResult }) => {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const prefs = JSON.parse(localStorage.getItem('comfyui_preferences') || '{}');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: prefs.audioInputId || undefined } });
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const text = await voiceService.transcribe(blob);
        if (text && onResult) onResult(text);
      };
      rec.start();
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    mediaRef.current && mediaRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="voice-input">
      <button className="mic-button" onClick={() => setOpen(o => !o)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12 1.5a3 3 0 00-3 3v6a3 3 0 006 0v-6a3 3 0 00-3-3zM5.25 10.5v1.5a6.75 6.75 0 0013.5 0v-1.5M12 19.5v3m-3 0h6"/>
        </svg>
      </button>
      {open && (
        <button className="record-button" onClick={recording ? stopRecording : startRecording}>
          {recording ? 'Done' : 'Start'}
        </button>
      )}
    </div>
  );
};

export default VoiceInput;
