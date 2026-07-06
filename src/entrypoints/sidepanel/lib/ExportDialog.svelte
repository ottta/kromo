<script lang="ts">
  import { getThemeStore } from '@/lib/theme-store.svelte';

  let { onClose }: { onClose: () => void } = $props();

  const store = getThemeStore();

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const css = $derived(store.exportCss());

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(css);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (error) {
      console.error('Kromo: failed to copy export to clipboard', error);
    }
  }

  function handleDownload(): void {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const slug = store.origin.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-') || 'kromo';
    anchor.href = url;
    anchor.download = `${slug}-theme.css`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-20 flex items-end justify-center bg-black/50 p-3"
  role="presentation"
  onclick={onClose}
>
  <div
    class="flex max-h-[85vh] w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-lg"
    role="dialog"
    aria-modal="true"
    aria-label="Export theme CSS"
    tabindex="-1"
    onclick={(event) => event.stopPropagation()}
    onkeydown={(event) => event.stopPropagation()}
  >
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Export theme CSS</h2>
      <button
        type="button"
        class="text-xs text-muted-foreground hover:text-foreground"
        onclick={onClose}
      >
        Close
      </button>
    </div>
    <p class="text-xs text-muted-foreground">
      Paste this into your CMS or stylesheet to ship the theme.
    </p>
    <textarea
      readonly
      class="h-64 w-full flex-1 resize-none rounded border border-input bg-background p-2 font-mono text-[11px] text-foreground"
      value={css}
      onclick={(event) => event.currentTarget.select()}></textarea>
    <div class="flex gap-1.5">
      <button
        type="button"
        class="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground"
        onclick={handleCopy}
      >
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </button>
      <button
        type="button"
        class="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground"
        onclick={handleDownload}
      >
        Download .css
      </button>
    </div>
  </div>
</div>
