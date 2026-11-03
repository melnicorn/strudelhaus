// The assistant's settings: the learner's own API key, the model and the prompt. Kept under its
// own storage key so backups and "move your progress" never carry the API key to another place.
import { z } from 'zod';
import { KEYS, readJson, writeJson } from '@/lib/storage/kv';
import { DEFAULT_PROMPT_SETTINGS } from './prompt';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Best answers' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Faster, about half the price' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', note: 'Fastest and cheapest' },
] as const;

export type ModelId = (typeof MODELS)[number]['id'];

export const assistantConfigSchema = z.object({
  apiKey: z.string().default(''),
  model: z.enum(MODELS.map((m) => m.id) as [ModelId, ...ModelId[]]).catch('claude-opus-5-5').default('claude-opus-5-5'),
  prompt: z
    .object({
      mode: z.enum(['default', 'extend', 'replace']).catch('default'),
      extra: z.string().catch(''),
      custom: z.string().catch(''),
    })
    .catch(DEFAULT_PROMPT_SETTINGS)
    .default(DEFAULT_PROMPT_SETTINGS),
  /** The panel was left open. */
  open: z.boolean().catch(false).default(false),
});

export type AssistantConfig = z.infer<typeof assistantConfigSchema>;

export function loadAssistantConfig(): AssistantConfig {
  return readJson(KEYS.assistant, assistantConfigSchema, assistantConfigSchema.parse({}));
}

export function saveAssistantConfig(config: AssistantConfig): boolean {
  return writeJson(KEYS.assistant, config);
}
