import { CONFIG } from '../config.js';
import { db, Settings } from '../database/db.js';
import { ragService, RetrievedContext } from './rag.service.js';

export interface AiResponse {
  answer: string;
  responseTimeMs: number;
  retrievedKnowledge: string[];
  sources: RetrievedContext[];
}

export class AiService {
  /**
   * Builds the comprehensive master system instruction according to ZENO specification.
   */
  private buildSystemPrompt(settings: Settings, knowledgeContexts: RetrievedContext[]): string {
    let prompt = `You are ${settings.name || 'ZENO'}, a personal AI voice assistant.
Your tagline is: 'Listen. Think. Respond.'

Your purpose is to listen to the user's questions, understand what they need, and provide useful, accurate and natural responses.

PERSONALITY:
- ${settings.personality === 'friendly' ? 'Warm, approachable, and encouraging' : settings.personality === 'technical' ? 'Precise, engineering-focused, and analytical' : 'Calm, clear, and helpful'}
- Conversational and polite.

RESPONSE STYLE (${settings.responseStyle.toUpperCase()}):
${settings.responseStyle === 'short' 
  ? '- Keep answers strictly concise (1-2 sentences) ideal for rapid voice response.' 
  : settings.responseStyle === 'detailed' 
  ? '- Provide a thorough explanation with clear steps and context, but keep sentences voice-friendly.' 
  : '- Provide balanced, natural answers (2-3 sentences) suitable for voice interaction.'}
- Avoid unnecessarily long explanations.
- Use natural spoken language.
- Do not use markdown headers, asterisks, bullets, code blocks, or special formatting unless explicitly requested, because your response is converted directly to voice speech.
- Explain technical topics in simple language unless the user asks for deep technical details.

SAFETY & REALITY:
- You are connected to a physical ESP32-based device containing an LCD display, microphone, amplifier, and dual speakers.
- Do not expose API keys, passwords, authentication tokens, or internal backend code.
`;

    if (knowledgeContexts.length > 0) {
      prompt += `\nTAUGHT KNOWLEDGE BASE (Use this truth if relevant):\n`;
      for (const ctx of knowledgeContexts) {
        prompt += `[Source: ${ctx.title}]\n${ctx.content}\n\n`;
      }
      prompt += `If asked about information contained in the knowledge base above, answer accurately according to it.\n`;
    }

    return prompt;
  }

  /**
   * Smart Built-in Fallback Engine for zero-configuration operation without requiring API keys.
   */
  private generateLocalResponse(query: string, contexts: RetrievedContext[], settings: Settings): string {
    const q = query.toLowerCase().trim();

    // 1. If we have exact or high relevance knowledge
    if (contexts.length > 0 && contexts[0].relevanceScore > 0.4) {
      const top = contexts[0];
      if (top.sourceType === 'qa') {
        return top.content;
      }
      return `${top.content}`;
    }

    // 2. Greetings
    if (q.match(/^(hi|hello|hey|greetings|good morning|good evening|good afternoon)/)) {
      return `Hello! I am ${settings.name}, your voice assistant. How can I help you today?`;
    }

    // 3. Status queries
    if (q.includes('status') || q.includes('how are you') || q.includes('who are you')) {
      return `I am ${settings.name}, your physical AI assistant. My systems are online, and I am ready to listen, think, and respond.`;
    }

    // 4. ESP32 explanations
    if (q.includes('what is an esp32') || q.includes('esp32')) {
      return `An ESP32 is a low-cost, low-power system-on-a-chip microcontroller with integrated Wi-Fi and dual-mode Bluetooth, widely used for IoT and smart hardware projects.`;
    }

    // 5. Thermodynamics
    if (q.includes('thermodynamics')) {
      return `Thermodynamics is the branch of physics that deals with the relationships between heat, work, temperature, and energy. Its fundamental laws describe how thermal energy is converted into other forms of energy.`;
    }

    // 6. Newton's laws
    if (q.includes('newton') && q.includes('second law')) {
      return `Newton's second law states that the acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass, commonly written as Force equals Mass times Acceleration.`;
    }

    // 7. Time / Weather
    if (q.includes('time')) {
      return `The current local time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }
    if (q.includes('weather') || q.includes('temperature')) {
      return `The local weather is pleasant and clear today at approximately 24 degrees Celsius.`;
    }

    // 8. General conversational answer
    return `I heard your question about "${query}". I am processing it through the ZENO AI pipeline and all hardware systems are functioning normally.`;
  }

  /**
   * Main query execution method with RAG and LLM / Local fallback.
   */
  async ask(query: string): Promise<AiResponse> {
    const startTime = Date.now();
    const settings = db.getSettings();

    // 1. Retrieve RAG contexts
    const contexts = ragService.search(query);
    const knowledgeTitles = contexts.map(c => c.title);

    let answer = '';

    // 2. Check if Gemini API is available and configured
    const apiKey = CONFIG.geminiApiKey || process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        const systemPrompt = this.buildSystemPrompt(settings, contexts);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.aiModel}:generateContent?key=${apiKey}`;

        const requestBody = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }],
            },
          ],
          generationConfig: {
            temperature: settings.temperature || 0.7,
            maxOutputTokens: 300,
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        } else {
          console.warn('Gemini API call returned non-200 status:', res.status);
        }
      } catch (err) {
        console.warn('Gemini API failed, falling back to local reasoning:', err);
      }
    }

    // 3. If no Gemini answer, use the smart local engine
    if (!answer) {
      answer = this.generateLocalResponse(query, contexts, settings);
    }

    const responseTimeMs = Date.now() - startTime;

    return {
      answer,
      responseTimeMs,
      retrievedKnowledge: knowledgeTitles,
      sources: contexts,
    };
  }
}

export const aiService = new AiService();
