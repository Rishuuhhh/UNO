// Web Audio API procedural sound effects — no external libraries
let _ctx = null;

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function playTone({ type = 'sine', freqStart, freqEnd, duration, gainPeak = 0.4, startTime }) {
  const ctx = getCtx();
  const t = startTime ?? ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  }

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}

const sounds = {
  playCard() {
    // Short swoosh: frequency sweep down
    playTone({ type: 'sine', freqStart: 800, freqEnd: 200, duration: 0.18, gainPeak: 0.25 });
  },

  drawCard() {
    // Soft thud: low frequency burst
    playTone({ type: 'triangle', freqStart: 120, freqEnd: 60, duration: 0.15, gainPeak: 0.35 });
  },

  unoCall() {
    // Sharp ascending beep
    playTone({ type: 'square', freqStart: 600, freqEnd: 1200, duration: 0.2, gainPeak: 0.2 });
  },

  turnChange() {
    // Subtle tick
    playTone({ type: 'sine', freqStart: 1000, freqEnd: 900, duration: 0.08, gainPeak: 0.15 });
  },

  win() {
    // Ascending fanfare: 3 notes
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      playTone({ freqStart: freq, freqEnd: freq, duration: 0.22, gainPeak: 0.3, startTime: now + i * 0.18 });
    });
  },

  timeWarning() {
    // Urgent beep
    playTone({ type: 'square', freqStart: 880, freqEnd: 880, duration: 0.12, gainPeak: 0.3 });
  },

  roundEnd() {
    // Descending tone
    playTone({ type: 'sine', freqStart: 700, freqEnd: 300, duration: 0.28, gainPeak: 0.3 });
  },
};

export function useSound() {
  const play = (soundName) => {
    try {
      if (sounds[soundName]) sounds[soundName]();
    } catch (e) {
      // Silently ignore audio errors
    }
  };
  return { play };
}

export default useSound;
