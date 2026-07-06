<script lang="ts">
  import type { TokenDef } from '@/lib/tokens';
  import { getThemeStore } from '@/lib/theme-store.svelte';
  import ColorField from './ColorField.svelte';

  let { token, onEdited }: { token: TokenDef; onEdited: () => void } = $props();

  const store = getThemeStore();

  const value = $derived(store.working[store.mode][token.cssVar] ?? '');

  function handleInput(next: string): void {
    store.setToken(store.mode, token.cssVar, next);
    onEdited();
  }
</script>

<div class="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
  <span class="min-w-0 flex-1 truncate text-xs text-card-foreground" title={token.cssVar}>
    {token.label}
  </span>
  {#if token.type === 'color'}
    <ColorField {value} onInput={handleInput} />
  {:else}
    <input
      type="text"
      class="w-24 shrink-0 rounded border border-input bg-background px-1.5 py-1 text-right font-mono text-[11px] text-foreground"
      {value}
      oninput={(event) => handleInput(event.currentTarget.value)}
      spellcheck="false"
    />
  {/if}
</div>
