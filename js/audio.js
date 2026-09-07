/**
 * Web Audio sintetizado, fail-open (ADR-007).
 * MUST NOT exportar mute/volume. MUST NOT carregar MP3/OGG. MUST NOT microfone.
 */

let ctx = null;
let mutedByPolicy = false;

function audioCtor() {
  return globalThis.AudioContext || globalThis.webkitAudioContext;
}

function now() {
  return ctx ? ctx.currentTime : 0;
}

function connectGain(targetGain) {
  const gain = ctx.createGain();
  gain.gain.value = targetGain;
  gain.connect(ctx.destination);
  return gain;
}

function noiseBuffer(duration = 0.12) {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * duration));
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  return buffer;
}

function playNoise({ duration = 0.1, gain = 0.035, freq = 1800 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 0.9;
  const g = connectGain(0);
  const t = now();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(g);
  src.start(t);
  src.stop(t + duration + 0.02);
}

function playTone({ freq = 420, duration = 0.08, gain = 0.04, type = 'triangle', slide = 0 } = {}) {
  const osc = ctx.createOscillator();
  osc.type = type;
  const g = connectGain(0);
  const t = now();
  osc.frequency.setValueAtTime(freq, t);
  if (slide) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + duration);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function oneShot(evento) {
  switch (evento) {
    case 'shuffle':
      playNoise({ duration: 0.16, gain: 0.03, freq: 1400 });
      playTone({ freq: 180, duration: 0.12, gain: 0.02, type: 'sine' });
      break;
    case 'deal':
      playNoise({ duration: 0.05, gain: 0.028, freq: 2200 });
      playTone({ freq: 740, duration: 0.05, gain: 0.025, type: 'triangle', slide: -120 });
      break;
    case 'flop':
      playTone({ freq: 390, duration: 0.07, gain: 0.03, type: 'sine' });
      playNoise({ duration: 0.08, gain: 0.022, freq: 1600 });
      break;
    case 'showdown':
      playTone({ freq: 520, duration: 0.09, gain: 0.032, type: 'triangle', slide: 80 });
      playTone({ freq: 780, duration: 0.1, gain: 0.02, type: 'sine' });
      break;
    case 'acerto':
      playTone({ freq: 523.25, duration: 0.09, gain: 0.035, type: 'sine' });
      playTone({ freq: 659.25, duration: 0.12, gain: 0.028, type: 'triangle' });
      break;
    case 'erro':
      playTone({ freq: 196, duration: 0.11, gain: 0.03, type: 'sine', slide: -50 });
      playNoise({ duration: 0.06, gain: 0.018, freq: 400 });
      break;
    default:
      break;
  }
}

/** Cria/resume AudioContext. Nunca lança. */
export async function unlock() {
  try {
    const AC = audioCtor();
    if (typeof AC !== 'function') {
      mutedByPolicy = true;
      return;
    }
    if (!ctx) {
      ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      await ctx.resume();
    }
    if (ctx && ctx.state !== 'running') {
      mutedByPolicy = true;
    }
  } catch {
    mutedByPolicy = true;
    ctx = null;
  }
}

/** One-shot curto. No-op se o contexto não estiver usável. Nunca lança. */
export function play(evento) {
  try {
    if (mutedByPolicy || !ctx || ctx.state !== 'running') {
      return;
    }
    oneShot(evento);
  } catch {
    /* mesa segue muda */
  }
}
