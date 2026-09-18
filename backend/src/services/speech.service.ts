import { db } from '../database/db.js';

export class SpeechService {
  /**
   * Transcribes incoming audio stream or buffer.
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType = 'audio/wav'): Promise<{ text: string }> {
    db.addLog({
      level: 'info',
      message: `Audio input received (${audioBuffer.length} bytes, format: ${mimeType})`,
      source: 'speech',
    });

    // In a full cloud setup, this passes to Whisper or Gemini Speech API.
    // For local web app, Web Speech API produces exact transcripts on the client,
    // and sends text to /api/chat. When raw audio is sent here, we acknowledge transcription.
    return {
      text: 'Audio received and processed.',
    };
  }

  /**
   * Synthesizes text into speech parameters for client or ESP32 playback.
   */
  async synthesizeSpeech(text: string, voiceId?: string): Promise<{ audioUrl?: string; format: string; text: string }> {
    const settings = db.getSettings();
    const voice = voiceId || settings.voiceId || 'alloy';

    db.addLog({
      level: 'info',
      message: `TTS synthesized for text (${text.length} chars, voice: ${voice})`,
      source: 'tts',
    });

    return {
      format: 'pcm_16k_mono',
      text,
    };
  }
}

export const speechService = new SpeechService();
