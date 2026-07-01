import React, { createContext, useContext, useState, useEffect } from 'react';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [isSoundOn, setIsSoundOn] = useState(() => {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sound_enabled', JSON.stringify(isSoundOn));
  }, [isSoundOn]);

  const playSound = (type) => {
    if (!isSoundOn) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      
      if (type === 'join') {
        // Double ascending beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } 
      else if (type === 'fill') {
        // Bright coin collect chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } 
      else if (type === 'bingo') {
        // Uplifting fanfare
        const notes = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.50]; // C5, E5, G5, E5, G5, C6
        const duration = 0.1;
        
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * duration);
          
          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * duration);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * duration + duration);
          
          osc.start(ctx.currentTime + idx * duration);
          osc.stop(ctx.currentTime + idx * duration + duration);
        });
      } 
      else if (type === 'complete') {
        // High energy victory tune
        const notes = [587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // D5 to C6 ascending
        const duration = 0.12;
        
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sawtooth'; // retro gamer vibe
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * (duration * 0.8));
          
          gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * (duration * 0.8));
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * (duration * 0.8) + duration);
          
          osc.start(ctx.currentTime + idx * (duration * 0.8));
          osc.stop(ctx.currentTime + idx * (duration * 0.8) + duration);
        });
        
        // Final lingering chord
        setTimeout(() => {
          const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
          chord.forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
            osc.start();
            osc.stop(ctx.currentTime + 1.2);
          });
        }, notes.length * duration * 0.8 * 1000);
      }
    } catch (err) {
      console.warn('Audio synthesis failed:', err);
    }
  };

  return (
    <SoundContext.Provider value={{ isSoundOn, setIsSoundOn, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
