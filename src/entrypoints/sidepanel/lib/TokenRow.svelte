<script lang="ts">
  import type { TokenDef } from '@/lib/tokens';
  import { getThemeStore } from '@/lib/theme-store.svelte';
  import ColorField from './ColorField.svelte';
  import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
  } from '@/lib/components/ui/input-group';
  import { cn } from '@/lib/utils';

  let { token, onEdited }: { token: TokenDef; onEdited: () => void } = $props();

  const store = getThemeStore();

  const value = $derived(store.working[store.mode][token.cssVar] ?? '');

  function handleInput(next: string): void {
    store.setToken(store.mode, token.cssVar, next);
    onEdited();
  }
</script>

<InputGroup>
  <InputGroupAddon>
    <InputGroupText title={token.cssVar}>
      {token.label}
    </InputGroupText>
  </InputGroupAddon>
  {#if token.type === 'color'}
    <ColorField {value} onInput={handleInput} />
  {:else}
    <InputGroupInput
      type="text"
      {value}
      oninput={(event) => handleInput(event.currentTarget.value)}
      spellcheck="false"
      class={cn('text-right', 'font-mono', 'text-sm')}
    />
  {/if}
</InputGroup>
