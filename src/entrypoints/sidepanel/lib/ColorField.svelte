<script lang="ts">
  import {
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
  } from '@/lib/components/ui/input-group';
  import { Popover, PopoverContent, PopoverTrigger } from '@/lib/components/ui/popover';
  import { toHex, toOklch } from '@/lib/css';
  import {
    CHECKERBOARD_BACKGROUND_IMAGE,
    CHECKERBOARD_BACKGROUND_POSITION,
    CHECKERBOARD_BACKGROUND_SIZE,
    cn,
  } from '@/lib/utils';
  import ColorPicker from './ColorPicker.svelte';

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

  // Alpha-preserving CSS color for the swatch preview (falls back to an
  // opaque hex for empty/unparseable input, since toOklch echoes those back
  // verbatim rather than throwing). Layered over a checkerboard in
  // `swatchStyle` below so translucency reads correctly.
  function safeCssColor(raw: string): string {
    const normalized = toOklch(raw);
    return /^oklch\(/i.test(normalized) ? normalized : safeHex(raw);
  }

  const swatchColor = $derived(safeCssColor(value));

  // Color layer first (paints on top, so its own alpha shows the
  // checkerboard through), checkerboard layers behind.
  const swatchStyle = $derived(
    [
      `background-image: linear-gradient(${swatchColor}, ${swatchColor}), ${CHECKERBOARD_BACKGROUND_IMAGE};`,
      `background-size: 100% 100%, ${CHECKERBOARD_BACKGROUND_SIZE};`,
      `background-position: 0 0, ${CHECKERBOARD_BACKGROUND_POSITION};`,
    ].join(' '),
  );
</script>

<InputGroupInput
  type="text"
  class={cn('text-right', 'font-mono', 'text-sm')}
  {value}
  oninput={(event) => onInput(event.currentTarget.value)}
  spellcheck="false"
/>

<InputGroupAddon align="inline-end">
  <Popover>
    <PopoverTrigger>
      {#snippet child({ props })}
        <InputGroupButton {...props} size="icon-xs" variant="outline" style={swatchStyle}>
          <span class="sr-only">{swatchColor}</span>
        </InputGroupButton>
      {/snippet}
    </PopoverTrigger>
    <PopoverContent class={cn('w-64')}>
      <ColorPicker {value} {onInput} />
    </PopoverContent>
  </Popover>
</InputGroupAddon>
