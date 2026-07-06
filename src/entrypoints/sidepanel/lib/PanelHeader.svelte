<script lang="ts">
  import { getThemeStore } from '@/lib/theme-store.svelte';
  import type { ThemeMode } from '@/lib/tokens';

  let {
    ready,
    onExport,
    onImport,
    onReset,
  }: {
    ready: boolean;
    onExport: () => void;
    onImport: () => void;
    onReset: () => void;
  } = $props();

  const store = getThemeStore();

  let confirmingReset = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function handleResetClick(): void {
    if (!confirmingReset) {
      confirmingReset = true;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        confirmingReset = false;
      }, 3000);
      return;
    }
    clearTimeout(resetTimer);
    confirmingReset = false;
    onReset();
  }

  function setMode(mode: ThemeMode): void {
    store.setMode(mode);
  }
</script>

<header
  class="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-background px-3 py-2.5"
>
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-1.5">
      <span class="truncate text-sm font-semibold text-foreground">
        {store.origin || 'Kromo'}
      </span>
      {#if store.dirty}
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title="Unsaved changes"></span>
      {/if}
    </div>
    <div class="flex shrink-0 overflow-hidden rounded-md border border-border text-xs">
      <button
        type="button"
        class="px-2 py-1 transition-colors disabled:opacity-50 {store.mode === 'light'
          ? 'bg-primary text-primary-foreground'
          : 'bg-background text-foreground'}"
        onclick={() => setMode('light')}
        disabled={!ready}
      >
        Light
      </button>
      <button
        type="button"
        class="px-2 py-1 transition-colors disabled:opacity-50 {store.mode === 'dark'
          ? 'bg-primary text-primary-foreground'
          : 'bg-background text-foreground'}"
        onclick={() => setMode('dark')}
        disabled={!ready}
      >
        Dark
      </button>
    </div>
  </div>

  <div class="flex gap-1.5">
    <button
      type="button"
      class="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
      onclick={onExport}
      disabled={!ready}
    >
      Export CSS
    </button>
    <button
      type="button"
      class="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
      onclick={onImport}
      disabled={!ready}
    >
      Import
    </button>
    <button
      type="button"
      class="flex-1 rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-50 {confirmingReset
        ? 'border-destructive bg-destructive text-destructive-foreground'
        : 'border-border text-foreground'}"
      onclick={handleResetClick}
      disabled={!ready}
    >
      {confirmingReset ? 'Confirm?' : 'Reset'}
    </button>
  </div>
</header>
