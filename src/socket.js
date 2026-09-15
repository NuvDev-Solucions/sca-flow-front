// client/src/socket.js
import { io } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const URL = isLocal ? 'http://localhost:4000' : 'https://dummy-disabled-socket.local';

export const socket = io(URL, {
  autoConnect: isLocal,
  reconnection: isLocal,
  reconnectionAttempts: 2,
  reconnectionDelay: 1000
});

// Sintetizador de Som Chime (Ding-Dong Triplo Clássico de Painel de Aeroporto / Banco)
// Usa Web Audio API pura - zero dependência de arquivos externos!
let audioCtx = null;

export function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    // Três notas harmoniosas: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz)
    const notes = [
      { freq: 523.25, time: now },
      { freq: 659.25, time: now + 0.18 },
      { freq: 783.99, time: now + 0.36 }
    ];

    notes.forEach(({ freq, time }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + 0.85);
    });
  } catch (err) {
    console.warn('Erro ao tocar chime:', err);
  }
}

// Sintetizador de Voz em Português
export function speakTicket(ticket) {
  if (!window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // Cancela falas anteriores

    const prioTexto = ticket.prioridadeId === 'ESPECIAL' 
      ? 'Prioridade Especial' 
      : ticket.prioridadeId === 'PREFERENCIAL' 
        ? 'Atendimento Prioritário' 
        : '';
    const guicheTexto = ticket.guiche || 'Guichê 01';
    
    // Soletra as letras da senha e fala o número com clareza
    // Ex: "Senha P E 0 0 1, Prioridade Especial, Comparecer ao Guichê 01"
    const codigoSpaced = ticket.codigo.split('').join(' ');
    const phrase = `Senha ${codigoSpaced}. ${prioTexto}. Comparecer ao ${guicheTexto}.`;

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Busca voz em pt-BR se disponível
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.name.includes('Brazil') || v.name.includes('Portuguese'));
    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Erro na síntese de voz:', err);
  }
}

// Formatador de segundos para MM:SS ou HH:MM:SS
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
