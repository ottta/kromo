<script lang="ts">
  import { hsv as toHsv, oklch as toOklch } from 'culori';
  import { formatOklch, parseColor } from '@/lib/css';
  import { Input } from '@/lib/components/ui/input';
  import {
    CHECKERBOARD_BACKGROUND_IMAGE,
    CHECKERBOARD_BACKGROUND_POSITION,
    CHECKERBOARD_BACKGROUND_SIZE,
    cn,
  } from '@/lib/utils';

  let { value, onInput }: { value: string; onInput: (value: string) => void } = $props();

  // Minimum HSV saturation before we trust its derived hue. Below this, the
  // oklch -> rgb -> hsv round trip returns hue noise (the color is grey), so
  // we keep whatever hue was last meaningful instead of snapping/jittering.
  const HUE_EPSILON = 1e-3;

  // Canonical color state (OKLCH) - the single source of truth we emit from.
  let l = $state(0);
  let c = $state(0);
  let h = $state(0);
  let alpha = $state(1);

  // The hue driving the square backdrop / hue slider thumb, in HSV-space
  // degrees. Kept separate from canonical `h` (a different hue metric) and
  // only updated when the color is meaningfully chromatic - see HUE_EPSILON.
  let stableHue = $state(0);

  let lastEmitted: string | null = null;

  // Sync an external `value` change into canonical state, but only when it
  // didn't originate from our own emit() - otherwise our own normalized
  // output would bounce back and jump the thumbs mid-drag.
  $effect(() => {
    const normalized = formatOklch(parseColor(value));
    if (normalized === lastEmitted) return;
    const parsed = parseColor(value);
    l = parsed.l;
    c = parsed.c;
    h = parsed.h;
    alpha = parsed.alpha;
    lastEmitted = normalized;

    // The incoming value didn't originate from our own emit (e.g. Reset,
    // Import, or a light/dark mode switch), so `stableHue` needs to be
    // re-synced too - otherwise it keeps whatever hue was last dragged and
    // the square backdrop / hue thumb go stale on an achromatic incoming
    // value (see HUE_EPSILON above).
    const incomingHsv = toHsv({
      mode: 'oklch',
      l: parsed.l,
      c: parsed.c,
      h: parsed.h,
      alpha: parsed.alpha,
    });
    if (
      typeof incomingHsv.h === 'number' &&
      Number.isFinite(incomingHsv.h) &&
      incomingHsv.s > HUE_EPSILON
    ) {
      stableHue = incomingHsv.h;
    } else {
      stableHue = Number.isFinite(parsed.h) ? parsed.h : 0;
    }
  });

  const hsvView = $derived(toHsv({ mode: 'oklch', l, c, h, alpha }));
  const satView = $derived(Number.isFinite(hsvView.s) ? hsvView.s : 0);
  const valView = $derived(Number.isFinite(hsvView.v) ? hsvView.v : 0);

  $effect(() => {
    const derivedHue = hsvView.h;
    if (typeof derivedHue === 'number' && Number.isFinite(derivedHue) && hsvView.s > HUE_EPSILON) {
      stableHue = derivedHue;
    }
  });

  const opaqueColor = $derived(formatOklch({ l, c, h, alpha: 1 }));

  function clamp01(n: number): number {
    return Math.min(1, Math.max(0, n));
  }

  function emit(): void {
    const next = formatOklch({ l, c, h, alpha });
    lastEmitted = next;
    onInput(next);
  }

  function applyHsv(hueDeg: number, s: number, v: number): void {
    const result = toOklch({ mode: 'hsv', h: hueDeg, s, v, alpha });
    l = clamp01(result.l ?? l);
    c = result.c ?? 0;
    h = typeof result.h === 'number' && Number.isFinite(result.h) ? result.h : h;
    stableHue = hueDeg;
    emit();
  }

  function fractionFromPointer(event: PointerEvent, el: HTMLElement, axis: 'x' | 'y'): number {
    const rect = el.getBoundingClientRect();
    const size = axis === 'x' ? rect.width : rect.height;
    const offset = axis === 'x' ? event.clientX - rect.left : event.clientY - rect.top;
    return size === 0 ? 0 : clamp01(offset / size);
  }

  function updateFromSquare(event: PointerEvent, el: HTMLElement): void {
    const s = fractionFromPointer(event, el, 'x');
    const v = 1 - fractionFromPointer(event, el, 'y');
    applyHsv(stableHue, s, v);
  }

  function handleSquarePointerDown(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    updateFromSquare(event, el);
  }

  function handleSquarePointerMove(event: PointerEvent): void {
    if (event.buttons === 0) return;
    updateFromSquare(event, event.currentTarget as HTMLElement);
  }

  function handleSquareKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.1 : 0.01;
    let s = satView;
    let v = valView;
    switch (event.key) {
      case 'ArrowLeft':
        s = clamp01(s - step);
        break;
      case 'ArrowRight':
        s = clamp01(s + step);
        break;
      case 'ArrowUp':
        v = clamp01(v + step);
        break;
      case 'ArrowDown':
        v = clamp01(v - step);
        break;
      default:
        return;
    }
    event.preventDefault();
    applyHsv(stableHue, s, v);
  }

  function updateFromHue(event: PointerEvent, el: HTMLElement): void {
    const hueDeg = fractionFromPointer(event, el, 'x') * 360;
    applyHsv(hueDeg, satView, valView);
  }

  function handleHuePointerDown(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    updateFromHue(event, el);
  }

  function handleHuePointerMove(event: PointerEvent): void {
    if (event.buttons === 0) return;
    updateFromHue(event, event.currentTarget as HTMLElement);
  }

  function handleHueKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 10 : 1;
    let hueDeg = stableHue;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      hueDeg = (hueDeg - step + 360) % 360;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      hueDeg = (hueDeg + step) % 360;
    } else {
      return;
    }
    event.preventDefault();
    applyHsv(hueDeg, satView, valView);
  }

  function updateFromAlpha(event: PointerEvent, el: HTMLElement): void {
    alpha = fractionFromPointer(event, el, 'x');
    emit();
  }

  function handleAlphaPointerDown(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    updateFromAlpha(event, el);
  }

  function handleAlphaPointerMove(event: PointerEvent): void {
    if (event.buttons === 0) return;
    updateFromAlpha(event, event.currentTarget as HTMLElement);
  }

  function handleAlphaKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 0.1 : 0.01;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      alpha = clamp01(alpha - step);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      alpha = clamp01(alpha + step);
    } else {
      return;
    }
    event.preventDefault();
    emit();
  }

  function handleLField(raw: string): void {
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    l = clamp01(next);
    emit();
  }

  function handleCField(raw: string): void {
    const next = Number(raw);
    if (!Number.isFinite(next) || next < 0) return;
    c = next;
    emit();
  }

  function handleHField(raw: string): void {
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    h = ((next % 360) + 360) % 360;
    stableHue = h;
    emit();
  }

  function handleAlphaField(rawPercent: string): void {
    const next = Number(rawPercent);
    if (!Number.isFinite(next)) return;
    alpha = clamp01(next / 100);
    emit();
  }

  const checkerboardStyle = `background-image: ${CHECKERBOARD_BACKGROUND_IMAGE}; background-size: ${CHECKERBOARD_BACKGROUND_SIZE}; background-position: ${CHECKERBOARD_BACKGROUND_POSITION};`;
</script>

<div class="flex w-full flex-col gap-3">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-md border border-border"
    style={`background-image: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent); background-color: hsl(${stableHue} 100% 50%);`}
    onpointerdown={handleSquarePointerDown}
    onpointermove={handleSquarePointerMove}
  >
    <div
      role="slider"
      aria-label="Saturation and value"
      aria-valuenow={Math.round(valView * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`Saturation ${Math.round(satView * 100)}%, value ${Math.round(valView * 100)}%`}
      tabindex="0"
      class="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30"
      style={`left: ${satView * 100}%; top: ${(1 - valView) * 100}%;`}
      onkeydown={handleSquareKeydown}
    ></div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative h-3 w-full rounded-full"
    style="background-image: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);"
    onpointerdown={handleHuePointerDown}
    onpointermove={handleHuePointerMove}
  >
    <div
      role="slider"
      aria-label="Hue"
      aria-valuenow={Math.round(stableHue)}
      aria-valuemin={0}
      aria-valuemax={360}
      tabindex="0"
      class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30"
      style={`left: ${(stableHue / 360) * 100}%;`}
      onkeydown={handleHueKeydown}
    ></div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative h-3 w-full rounded-full border border-border"
    style={checkerboardStyle}
    onpointerdown={handleAlphaPointerDown}
    onpointermove={handleAlphaPointerMove}
  >
    <div
      class="absolute inset-0 rounded-full"
      style={`background-image: linear-gradient(to right, transparent, ${opaqueColor});`}
    ></div>
    <div
      role="slider"
      aria-label="Alpha"
      aria-valuenow={Math.round(alpha * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabindex="0"
      class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30"
      style={`left: ${alpha * 100}%;`}
      onkeydown={handleAlphaKeydown}
    ></div>
  </div>

  <div class="grid grid-cols-4 gap-1.5">
    <label class="flex flex-col gap-0.5">
      <span class="text-[10px] text-muted-foreground">L</span>
      <Input
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={Math.round(l * 1000) / 1000}
        oninput={(event) => handleLField(event.currentTarget.value)}
        class={cn('h-7', 'px-1.5', 'text-xs')}
      />
    </label>
    <label class="flex flex-col gap-0.5">
      <span class="text-[10px] text-muted-foreground">C</span>
      <Input
        type="number"
        min="0"
        max="0.4"
        step="0.005"
        value={Math.round(c * 1000) / 1000}
        oninput={(event) => handleCField(event.currentTarget.value)}
        class={cn('h-7', 'px-1.5', 'text-xs')}
      />
    </label>
    <label class="flex flex-col gap-0.5">
      <span class="text-[10px] text-muted-foreground">H</span>
      <Input
        type="number"
        min="0"
        max="360"
        step="1"
        value={Math.round(h * 10) / 10}
        oninput={(event) => handleHField(event.currentTarget.value)}
        class={cn('h-7', 'px-1.5', 'text-xs')}
      />
    </label>
    <label class="flex flex-col gap-0.5">
      <span class="text-[10px] text-muted-foreground">A %</span>
      <Input
        type="number"
        min="0"
        max="100"
        step="1"
        value={Math.round(alpha * 100)}
        oninput={(event) => handleAlphaField(event.currentTarget.value)}
        class={cn('h-7', 'px-1.5', 'text-xs')}
      />
    </label>
  </div>
</div>
