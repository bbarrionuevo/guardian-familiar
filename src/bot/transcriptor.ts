// Transcripción de audios. En Cloudflare se usa Whisper de Workers AI.

export interface Transcriber {
  transcribe(audio: Uint8Array): Promise<string | null>;
}

// Forma mínima del binding AI de Workers que usamos.
interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export function createWorkersAiTranscriber(ai: AiBinding, log: (m: string) => void = () => {}): Transcriber {
  return {
    async transcribe(audio) {
      try {
        const out = (await ai.run('@cf/openai/whisper', { audio: [...audio] })) as { text?: string };
        const text = out?.text?.trim();
        return text ? text : null;
      } catch (err) {
        log(`whisper: ${(err as Error).name}`);
        return null;
      }
    },
  };
}
