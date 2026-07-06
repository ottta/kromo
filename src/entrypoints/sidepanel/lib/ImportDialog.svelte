<script lang="ts">
  let { onClose, onSubmit }: { onClose: () => void; onSubmit: (css: string) => void } = $props();

  let text = $state('');

  function handleSubmit(): void {
    if (!text.trim()) return;
    onSubmit(text);
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
    aria-label="Import theme CSS"
    tabindex="-1"
    onclick={(event) => event.stopPropagation()}
    onkeydown={(event) => event.stopPropagation()}
  >
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Import theme CSS</h2>
      <button
        type="button"
        class="text-xs text-muted-foreground hover:text-foreground"
        onclick={onClose}
      >
        Close
      </button>
    </div>
    <p class="text-xs text-muted-foreground">
      Paste a shadcn theme stylesheet (<code class="font-mono">:root</code> /
      <code class="font-mono">.dark</code> blocks). This replaces all current values.
    </p>
    <textarea
      class="h-64 w-full flex-1 resize-none rounded border border-input bg-background p-2 font-mono text-[11px] text-foreground"
      placeholder={':root {\n  --primary: oklch(0.205 0 0);\n}'}
      bind:value={text}></textarea>
    <div class="flex gap-1.5">
      <button
        type="button"
        class="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        onclick={handleSubmit}
        disabled={!text.trim()}
      >
        Apply import
      </button>
      <button
        type="button"
        class="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground"
        onclick={onClose}
      >
        Cancel
      </button>
    </div>
  </div>
</div>
