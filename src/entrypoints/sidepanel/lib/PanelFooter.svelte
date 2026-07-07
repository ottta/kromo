<script lang="ts">
  import { Button } from '@/lib/components/ui/button';
  import { ButtonGroup } from '@/lib/components/ui/button-group';
  import { Popover, PopoverContent, PopoverTrigger } from '@/lib/components/ui/popover';
  import { cn } from '@/lib/utils';

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
</script>

<footer
  class={cn(
    'sticky',
    'bottom-0',
    'z-50',
    'bg-background',
    'text-foreground',
    'py-2.5',
    'px-3',
    'flex',
    'items-center',
    'justify-between',
  )}
>
  <ButtonGroup>
    <Popover>
      <PopoverTrigger>
        {#snippet child({ props })}
          <Button {...props} size="sm" variant="secondary">Export</Button>
        {/snippet}
      </PopoverTrigger>
      <PopoverContent>
        <Button type="button" size="sm" variant="secondary" onclick={onExport} disabled={!ready}>
          Export CSS
        </Button>
        <Button size="sm" variant="secondary">Export Tokens</Button>
      </PopoverContent>
    </Popover>

    <Button type="button" size="sm" variant="secondary" onclick={onImport} disabled={!ready}
      >Import</Button
    >
  </ButtonGroup>

  <Button
    type="button"
    size="sm"
    variant="destructive"
    onclick={handleResetClick}
    disabled={!ready}
  >
    {confirmingReset ? 'Confirm?' : 'Reset'}
  </Button>
</footer>
