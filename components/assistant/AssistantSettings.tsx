'use client';

import { Button, Input, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useState } from 'react';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { linkClass } from '@/components/ui/Page';
import { MODELS, type ModelId } from '@/lib/assistant/config';
import { DEFAULT_PROMPT, DEFAULT_PROMPT_SETTINGS, type PromptMode } from '@/lib/assistant/prompt';
import { useAssistantStore } from '@/lib/stores/assistant';

const label = 'text-xs font-semibold';
const note = 'm-0 text-xs text-muted';

/** API key, model and prompt. */
export function AssistantSettings() {
  const config = useAssistantStore((s) => s.config);
  const { setConfig, setShowSettings } = useAssistantStore.getState();
  const [showKey, setShowKey] = useState(false);
  const { prompt } = config;
  const setPrompt = (patch: Partial<typeof prompt>) => setConfig({ prompt: { ...prompt, ...patch } });
  const changed = prompt.mode !== 'default' || prompt.extra !== '' || prompt.custom !== '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 text-sm">
      <section className="flex flex-col gap-1.5">
        <label className={label} htmlFor="assistant-key">
          Claude API key
        </label>
        <div className="flex gap-1.5">
          <Input
            id="assistant-key"
            type={showKey ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-…"
            className="min-w-0 flex-1 font-mono text-xs"
            value={config.apiKey}
            onChange={(e) => setConfig({ apiKey: e.target.value.trim() })}
          />
          <Button size="sm" variant="ghost" onPress={() => setShowKey(!showKey)}>
            {showKey ? 'Hide' : 'Show'}
          </Button>
        </div>
        <p className={note}>
          The assistant uses your own key from{' '}
          <a className={linkClass} href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
            console.anthropic.com
          </a>
          , and you pay Anthropic for what it uses. The key is kept only in this browser (not in backups or progress
          codes) and is sent only to Anthropic, straight from your browser. A key just for this site, with a spend limit,
          is a good idea.
        </p>
        {config.apiKey && (
          <div className="flex gap-1.5">
            <Button size="sm" onPress={() => setShowSettings(false)}>
              Start chatting
            </Button>
            <Button size="sm" variant="ghost" onPress={() => setConfig({ apiKey: '' })}>
              Remove key
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-1.5">
        <span className={label}>Model</span>
        <SimpleSelect
          aria-label="Model"
          value={config.model}
          onChange={(v) => setConfig({ model: v as ModelId })}
          options={MODELS.map((m) => ({ value: m.id, label: `${m.label} · ${m.note}`, textValue: m.label }))}
        />
      </section>

      <section className="flex flex-col gap-1.5">
        <span className={label}>Instructions</span>
        <ToggleButtonGroup
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          aria-label="Instructions"
          selectedKeys={new Set([prompt.mode])}
          onSelectionChange={(keys) => {
            const mode = [...keys][0] as PromptMode | undefined;
            if (!mode) return;
            // Replacing starts from the default prompt, so there is something to edit.
            setPrompt(mode === 'replace' && !prompt.custom.trim() ? { mode, custom: DEFAULT_PROMPT } : { mode });
          }}
        >
          <ToggleButton id="default" className="h-7 px-2 text-xs">
            Default
          </ToggleButton>
          <ToggleButton id="extend" className="h-7 px-2 text-xs">
            <ToggleButtonGroup.Separator />
            Add to default
          </ToggleButton>
          <ToggleButton id="replace" className="h-7 px-2 text-xs">
            <ToggleButtonGroup.Separator />
            Write my own
          </ToggleButton>
        </ToggleButtonGroup>
        {prompt.mode === 'default' && (
          <p className={note}>
            The built-in Strudel guide, with this site’s reference, sounds and dictionary.
          </p>
        )}
        {prompt.mode === 'extend' && (
          <TextArea
            aria-label="Extra instructions"
            placeholder="e.g. Answer in Spanish. I know music theory, so skip the basics."
            rows={6}
            className="text-xs"
            value={prompt.extra}
            onChange={(e) => setPrompt({ extra: e.target.value })}
          />
        )}
        {prompt.mode === 'replace' && (
          <TextArea
            aria-label="Your instructions"
            rows={16}
            className="font-mono text-[11px]"
            value={prompt.custom}
            onChange={(e) => setPrompt({ custom: e.target.value })}
          />
        )}
        <p className={note}>The rules for reading and changing your code are always added, so editing keeps working.</p>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" isDisabled={!changed} onPress={() => setConfig({ prompt: DEFAULT_PROMPT_SETTINGS })}>
            Revert to default
          </Button>
        </div>
        {prompt.mode !== 'replace' && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted">Show the default instructions</summary>
            <pre className="mt-1 max-h-80 overflow-auto rounded-md bg-default p-2 font-mono text-[11px] whitespace-pre-wrap">{DEFAULT_PROMPT}</pre>
          </details>
        )}
      </section>
    </div>
  );
}
