<script lang="ts">
  import { Button } from '@/lib/components/ui/button';
  import { ButtonGroup } from '@/lib/components/ui/button-group';
  import { getThemeStore } from '@/lib/theme-store.svelte';
  import type { ThemeMode } from '@/lib/tokens';
  import { cn } from '@/lib/utils';

  let {
    showModeToggle,
  }: {
    showModeToggle: boolean;
  } = $props();

  const store = getThemeStore();

  function setMode(mode: ThemeMode): void {
    store.setMode(mode);
  }
</script>

<header
  class={cn(
    'sticky',
    'top-0',
    'z-50',
    'bg-background',
    'text-foreground',
    'flex',
    'items-center',
    'gap-3',
    'py-2.5',
  )}
>
  <div class="flex items-center justify-between gap-2 flex-1 min-w-0 px-4">
    <span class="truncate text-sm font-semibold text-foreground">
      {store.origin || 'Kromo'}
    </span>
    {#if store.dirty}
      <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title="Unsaved changes"></span>
    {/if}
  </div>

  {#if showModeToggle}
    <ButtonGroup>
      <Button
        type="button"
        size="sm"
        variant={store.mode === 'light' ? 'default' : 'secondary'}
        onclick={() => setMode('light')}
      >
        Light
      </Button>
      <Button
        type="button"
        size="sm"
        variant={store.mode === 'dark' ? 'default' : 'secondary'}
        onclick={() => setMode('dark')}
      >
        Dark
      </Button>
    </ButtonGroup>
  {/if}
</header>
