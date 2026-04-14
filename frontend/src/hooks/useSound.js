// Enhanced Web Audio API sound system with volume control and better UX
let _ctx = null;
let _masterGain = null;
let _soundEnabled = true;
let _volume = 0.7; // Default volume (0-1)

// Sound debouncing to prevent overlapping sounds
const _lastPlayed = new Map();
const DEBOUNCE_TIME = 100; // ms

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain node for volume control
    _masterGain = _ctx.createGain();
    _masterGain.connect(_ctx.destination);
    _masterGain.gain.setValueAtTime(_volume, _ctx.currentTime);
  }
  
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(console.warn);
  }
  return _ctx;
}

function canPlaySound(soundName) {
  if (!_soundEnabled) return false;
  
  const now = Date.now();
  const lastTime = _lastPlayed.get(soundName) || 0;
  
  if (now - lastTime < DEBOUNCE_TIME) {
    return false;
  }
  
  _lastPlayed.set(soundName, now);
  return true;
}

function playTone({ 
  type = 'sine', 
  freqStart, 
  freqEnd, 
  duration, 
  gainPeak = 0.3, 
  startTime,
  fadeIn = 0.01,
  fadeOut = 0.05
}) {
  try {
    const ctx = getCtx();
    const t = startTime ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(_masterGain);

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    }

    // Smooth gain envelope to prevent clicks
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainPeak, t + fadeIn);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration - fadeOut);

    osc.start(t);
    osc.stop(t + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

// Enhanced sound library with better audio design
const sounds = {
  playCard() {
    if (!canPlaySound('playCard')) return;
    
    // Satisfying card swoosh with harmonic
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    // Main swoosh
    playTone({ 
      type: 'sine', 
      freqStart: 600, 
      freqEnd: 200, 
      duration: 0.2, 
      gainPeak: 0.15,
      startTime: now
    });
    
    // Subtle harmonic for richness
    playTone({ 
      type: 'triangle', 
      freqStart: 300, 
      freqEnd: 100, 
      duration: 0.15, 
      gainPeak: 0.08,
      startTime: now + 0.02
    });
  },

  drawCard() {
    if (!canPlaySound('drawCard')) return;
    
    // Soft card draw sound
    playTone({ 
      type: 'triangle', 
      freqStart: 150, 
      freqEnd: 80, 
      duration: 0.18, 
      gainPeak: 0.2,
      fadeIn: 0.02,
      fadeOut: 0.08
    });
  },

  unoCall() {
    if (!canPlaySound('unoCall')) return;
    
    // Distinctive UNO call - two-tone chime
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    playTone({ 
      type: 'sine', 
      freqStart: 800, 
      freqEnd: 800, 
      duration: 0.15, 
      gainPeak: 0.25,
      startTime: now
    });
    
    playTone({ 
      type: 'sine', 
      freqStart: 1200, 
      freqEnd: 1200, 
      duration: 0.2, 
      gainPeak: 0.2,
      startTime: now + 0.1
    });
  },

  turnChange() {
    if (!canPlaySound('turnChange')) return;
    
    // Subtle turn notification
    playTone({ 
      type: 'sine', 
      freqStart: 880, 
      freqEnd: 660, 
      duration: 0.12, 
      gainPeak: 0.12,
      fadeOut: 0.06
    });
  },

  win() {
    if (!canPlaySound('win')) return;
    
    // Victory fanfare - ascending chord
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord)
    
    notes.forEach((freq, i) => {
      playTone({
        type: 'sine',
        freqStart: freq,
        freqEnd: freq,
        duration: 0.8,
        gainPeak: 0.15,
        startTime: now + i * 0.1,
        fadeOut: 0.3
      });
    });
  },

  timeWarning() {
    if (!canPlaySound('timeWarning')) return;
    
    // Urgent but not annoying warning
    playTone({ 
      type: 'square', 
      freqStart: 1000, 
      freqEnd: 1200, 
      duration: 0.1, 
      gainPeak: 0.18,
      fadeIn: 0.005,
      fadeOut: 0.03
    });
  },

  roundEnd() {
    if (!canPlaySound('roundEnd')) return;
    
    // Round completion sound
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    playTone({ 
      type: 'sine', 
      freqStart: 440, 
      freqEnd: 880, 
      duration: 0.4, 
      gainPeak: 0.2,
      startTime: now,
      fadeOut: 0.15
    });
  },

  error() {
    if (!canPlaySound('error')) return;
    
    // Gentle error notification
    playTone({ 
      type: 'triangle', 
      freqStart: 300, 
      freqEnd: 200, 
      duration: 0.25, 
      gainPeak: 0.15,
      fadeOut: 0.1
    });
  },

  buttonHover() {
    if (!canPlaySound('buttonHover')) return;
    
    // Subtle UI feedback
    playTone({ 
      type: 'sine', 
      freqStart: 800, 
      freqEnd: 900, 
      duration: 0.05, 
      gainPeak: 0.08
    });
  },

  buttonClick() {
    if (!canPlaySound('buttonClick')) return;
    
    // Satisfying click
    playTone({ 
      type: 'triangle', 
      freqStart: 600, 
      freqEnd: 400, 
      duration: 0.08, 
      gainPeak: 0.12
    });
  }
};

// Public API for sound control
export const soundManager = {
  setEnabled(enabled) {
    _soundEnabled = enabled;
    // Store preference
    try {
      localStorage.setItem('uno_sound_enabled', enabled.toString());
    } catch (e) {
      console.warn('Could not save sound preference');
    }
  },

  isEnabled() {
    return _soundEnabled;
  },

  setVolume(volume) {
    _volume = Math.max(0, Math.min(1, volume));
    if (_masterGain) {
      _masterGain.gain.setValueAtTime(_volume, getCtx().currentTime);
    }
    // Store preference
    try {
      localStorage.setItem('uno_sound_volume', _volume.toString());
    } catch (e) {
      console.warn('Could not save volume preference');
    }
  },

  getVolume() {
    return _volume;
  },

  // Initialize from stored preferences
  init() {
    try {
      const storedEnabled = localStorage.getItem('uno_sound_enabled');
      if (storedEnabled !== null) {
        _soundEnabled = storedEnabled === 'true';
      }

      const storedVolume = localStorage.getItem('uno_sound_volume');
      if (storedVolume !== null) {
        const vol = parseFloat(storedVolume);
        if (!isNaN(vol)) {
          _volume = Math.max(0, Math.min(1, vol));
        }
      }
    } catch (e) {
      console.warn('Could not load sound preferences');
    }
  }
};

// Initialize sound preferences on load
soundManager.init();

export function useSound() {
  return {
    play: (soundName) => {
      if (sounds[soundName]) {
        sounds[soundName]();
      } else {
        console.warn(`Sound "${soundName}" not found`);
      }
    },
    setEnabled: soundManager.setEnabled,
    isEnabled: soundManager.isEnabled,
    setVolume: soundManager.setVolume,
    getVolume: soundManager.getVolume
  };
}
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
