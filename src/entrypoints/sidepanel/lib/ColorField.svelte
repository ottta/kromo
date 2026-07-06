<script lang="ts">
  import { toHex, toOklch } from '@/lib/css';

  let { value, onInput }: { value: string; onInput: (value: string) => void } = $props();

  function safeHex(raw: string): string {
    if (!raw) return '#000000';
    try {
      const hex = toHex(raw);
      return /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#000000';
    } catch {
      return '#000000';
    }
  }

  const hex = $derived(safeHex(value));

  // The swatch only ever produces #rrggbb; normalize to oklch() so the
  // exported stylesheet stays in a single, consistent color format.
  function handleSwatchInput(nextHex: string): void {
    try {
      onInput(toOklch(nextHex));
    } catch {
      onInput(nextHex);
    }
  }
</script>

<div class="flex min-w-0 flex-1 items-center justify-end gap-1.5">
  <input
    type="color"
    class="h-6 w-6 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0"
    value={hex}
    oninput={(event) => handleSwatchInput(event.currentTarget.value)}
    aria-label="Pick color"
  />
  <input
    type="text"
    class="w-full min-w-0 rounded border border-input bg-background px-1.5 py-1 text-right font-mono text-[11px] text-foreground"
    {value}
    oninput={(event) => onInput(event.currentTarget.value)}
    spellcheck="false"
  />
</div>
