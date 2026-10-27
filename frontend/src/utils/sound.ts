/**
 * Sound & Voice Notification Utility
 * Uses Web Audio API for zero-dependency synthesized chimes (no missing MP3 files)
 * Uses Web Speech API for natural voice alerts
 */

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupUnlockListeners();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      const ctx = this.getAudioContext();
      if (ctx) {
        this.isUnlocked = true;
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public isSoundOn(): boolean {
    return this.soundEnabled;
  }

  public isVoiceOn(): boolean {
    return this.voiceEnabled;
  }

  /**
   * Play crystal-clear tone using Web Audio API
   */
  private playTone(frequency: number, durationSec: number, type: OscillatorType = 'sine', startTimeOffset = 0, gainLevel = 0.25) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTimeOffset);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + startTimeOffset);
      gain.gain.exponentialRampToValueAtTime(gainLevel, ctx.currentTime + startTimeOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTimeOffset + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTimeOffset);
      osc.stop(ctx.currentTime + startTimeOffset + durationSec + 0.05);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  /**
   * Melodic ascending chime for ORDER READY
   */
  public playOrderReady() {
    if (!this.soundEnabled) return;
    // Ascending arpeggio (C5 -> E5 -> G5 -> C6)
    this.playTone(523.25, 0.35, 'triangle', 0, 0.3);
    this.playTone(659.25, 0.35, 'triangle', 0.12, 0.3);
    this.playTone(783.99, 0.45, 'sine', 0.24, 0.35);
    this.playTone(1046.50, 0.7, 'sine', 0.36, 0.35);
  }

  /**
   * Resonant hospitality service bell for WAITER CALL (Ding-Dong)
   */
  public playWaiterCall() {
    if (!this.soundEnabled) return;
    // Classic two-tone front-desk service chime
    this.playTone(880.0, 0.5, 'sine', 0, 0.35);      // High Ding (A5)
    this.playTone(1760.0, 0.3, 'triangle', 0, 0.1);  // Harmonic overtone
    this.playTone(659.25, 0.7, 'sine', 0.22, 0.35);  // Resonant Dong (E5)
    this.playTone(1318.5, 0.4, 'triangle', 0.22, 0.1);
  }

  /**
   * Urgent pulse for escalations or overdue alerts
   */
  public playUrgentAlert() {
    if (!this.soundEnabled) return;
    this.playTone(987.77, 0.2, 'sawtooth', 0, 0.2);
    this.playTone(987.77, 0.25, 'sawtooth', 0.25, 0.25);
  }

  /**
   * Friendly human voice announcement using Web Speech API
   */
  public speakVoice(text: string) {
    if (!this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Cancel previous speech to prevent lagging audio queue
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      utterance.lang = 'en-US';

      // Pick an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('David')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice speech error:', err);
    }
  }

  /**
   * Combined sound chime + voice alert for Order Ready
   */
  public alertOrderReady(tableNumber?: string, orderNumber?: string) {
    this.playOrderReady();
    const tableText = tableNumber ? `for Table ${tableNumber.replace(/^T/i, '')}` : '';
    const message = `Order ready ${tableText}`.trim();
    // Delay voice slightly so the chime plays first
    setTimeout(() => {
      this.speakVoice(message);
    }, 450);
  }

  /**
   * Combined sound chime + voice alert for Waiter Call
   */
  public alertWaiterCall(tableNumber?: string, requestType?: string) {
    this.playWaiterCall();
    const cleanTable = tableNumber ? `Table ${tableNumber.replace(/^T/i, '')}` : 'A customer';
    const reason = requestType === 'BILL_REQUEST' ? 'requested the bill' : requestType === 'ORDER_READY' ? 'is ready to order' : 'is calling for assistance';
    const message = `${cleanTable} ${reason}`;
    setTimeout(() => {
      this.speakVoice(message);
    }, 450);
  }
}

export const soundManager = new SoundManager();

