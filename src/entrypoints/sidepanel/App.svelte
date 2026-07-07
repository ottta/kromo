<script lang="ts">
  import { onMount } from 'svelte';
  import { browser, type Browser } from 'wxt/browser';
  import { createThemeStore, setThemeStore } from '@/lib/theme-store.svelte';
  import { createFreshTabTracker } from '@/lib/fresh-tab-tracker';
  import { onMessage, sendMessage } from '@/lib/messaging';
  import { loadOverrides, saveOverrides, clearOverrides } from '@/lib/storage';
  import { TOKENS, isThemeSupported, type TokenGroup } from '@/lib/tokens';
  import { originFromUrl } from '@/lib/url';
  import PanelHeader from './lib/PanelHeader.svelte';
  import TokenRow from './lib/TokenRow.svelte';
  import ExportDialog from './lib/ExportDialog.svelte';
  import ImportDialog from './lib/ImportDialog.svelte';
  import PanelFooter from './lib/PanelFooter.svelte';
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '@/lib/components/ui/accordion';
  import { cn } from '@/lib/utils';

  const store = setThemeStore(createThemeStore());

  type Status = 'loading' | 'ready' | 'unavailable' | 'unsupported';

  let status = $state<Status>('loading');
  let unavailableMessage = $state('');
  let tabId = $state<number | undefined>(undefined);
  let darkSupported = $state(false);

  let showExport = $state(false);
  let showImport = $state(false);

  const GROUP_ORDER: TokenGroup[] = [
    'base',
    'primary',
    'secondary',
    'muted',
    'accent',
    'state',
    'card',
    'popover',
    'border',
    'chart',
    'sidebar',
  ];
  const GROUP_LABELS: Record<TokenGroup, string> = {
    base: 'Base',
    card: 'Card',
    popover: 'Popover',
    primary: 'Primary',
    secondary: 'Secondary',
    muted: 'Muted',
    accent: 'Accent',
    state: 'State',
    border: 'Border, Input & Ring',
    chart: 'Charts',
    sidebar: 'Sidebar',
  };

  const groups = $derived(
    GROUP_ORDER.map((group) => ({
      group,
      label: GROUP_LABELS[group],
      tokens: TOKENS.filter((token) => token.group === group),
    })),
  );

  let applyTimer: ReturnType<typeof setTimeout> | undefined;

  function scheduleApply(): void {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      void persist();
    }, 120);
  }

  async function persist(): Promise<void> {
    if (tabId !== undefined) {
      try {
        await sendMessage('applyOverrides', { [store.mode]: store.working[store.mode] }, tabId);
      } catch (error) {
        console.error('Kromo: failed to apply live preview', error);
      }
    }
    try {
      await saveOverrides(store.origin, store.working);
    } catch (error) {
      console.error('Kromo: failed to persist overrides', error);
    }
  }

  async function handleReset(): Promise<void> {
    store.reset();
    if (tabId !== undefined) {
      try {
        await sendMessage('resetOverrides', undefined, tabId);
      } catch (error) {
        console.error('Kromo: failed to reset live preview', error);
      }
    }
    try {
      await clearOverrides(store.origin);
    } catch (error) {
      console.error('Kromo: failed to clear persisted overrides', error);
    }
  }

  async function handleImportSubmit(css: string): Promise<void> {
    store.importCss(css);
    showImport = false;
    clearTimeout(applyTimer);
    // Import can rewrite both modes at once, so push the full working theme
    // live rather than the mode-partial used by scheduleApply/persist.
    if (tabId !== undefined) {
      try {
        await sendMessage('applyOverrides', store.working, tabId);
      } catch (error) {
        console.error('Kromo: failed to apply imported theme', error);
      }
    }
    try {
      await saveOverrides(store.origin, store.working);
    } catch (error) {
      console.error('Kromo: failed to persist imported theme', error);
    }
  }

  // Re-resolves the active tab + origin from scratch. Called on mount, and
  // again whenever the active tab's origin changes (tab switch or same-tab
  // navigation) so the panel never keeps showing a stale snapshot from a
  // page that's no longer in front.
  async function crawlActiveTab(): Promise<void> {
    clearTimeout(applyTimer);
    status = 'loading';

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const origin = originFromUrl(tab?.url);

      if (!origin || tab?.id === undefined) {
        tabId = undefined;
        darkSupported = false;
        status = 'unavailable';
        unavailableMessage =
          "Kromo can't edit this page. Open a regular website tab to read and edit its theme.";
        return;
      }

      tabId = tab.id;

      const { theme: baseline, mode } = await sendMessage('readTokens', undefined, tabId);

      if (!isThemeSupported(baseline.light)) {
        darkSupported = false;
        status = 'unsupported';
        return;
      }

      darkSupported = isThemeSupported(baseline.dark);

      const persisted = await loadOverrides(origin);
      store.loadTheme(origin, persisted ?? baseline);
      store.setMode(mode);

      if (persisted) {
        await sendMessage('applyOverrides', persisted, tabId);
      }

      status = 'ready';
    } catch (error) {
      console.error('Kromo: failed to initialize sidepanel', error);
      darkSupported = false;
      status = 'unavailable';
      unavailableMessage =
        'Kromo could not connect to this page. Try reloading the tab and reopening the panel.';
    }
  }

  onMount(() => {
    void crawlActiveTab();

    // Re-crawl if either the origin or the active tab id changed. Comparing
    // tabId too (not just origin) matters for two cases the origin-only
    // check misses: switching back to the same origin from an "unavailable"
    // tab (store.origin was never updated while unavailable, so an
    // origin-only check would see no change and stay stuck), and switching
    // between two different tabs that happen to share an origin (which would
    // otherwise leave `tabId` - and therefore live preview - pointed at the
    // wrong tab). Same-tab SPA routing (same tabId, same origin) is still
    // skipped; crawlActiveTab always re-resolves the current active tab, so
    // any extra re-crawl here is harmless.
    function shouldRecrawl(origin: string | null, newTabId: number | undefined): boolean {
      return origin !== store.origin || newTabId !== tabId;
    }

    const freshTabTracker = createFreshTabTracker();

    const handleCreated = (tab: Browser.tabs.Tab): void => {
      if (tab.id !== undefined) freshTabTracker.markCreated(tab.id);
    };

    const handleRemoved = (removedTabId: number): void => {
      freshTabTracker.markRemoved(removedTabId);
    };

    const handleActivated = (activeInfo: Browser.tabs.OnActivatedInfo): void => {
      void (async () => {
        try {
          const tab = await browser.tabs.get(activeInfo.tabId);
          const origin = originFromUrl(tab.url);
          if (freshTabTracker.shouldIgnore(activeInfo.tabId, origin)) return;
          if (shouldRecrawl(origin, tab.id)) {
            await crawlActiveTab();
          }
        } catch (error) {
          console.error('Kromo: failed to resolve activated tab', error);
        }
      })();
    };

    const handleUpdated = (
      updatedTabId: number,
      changeInfo: Browser.tabs.OnUpdatedInfo,
      tab: Browser.tabs.Tab,
    ): void => {
      if (!tab.active) return;
      if (changeInfo.status !== 'complete' && !changeInfo.url) return;

      const origin = originFromUrl(tab.url);
      if (freshTabTracker.shouldIgnore(updatedTabId, origin)) return;
      if (shouldRecrawl(origin, updatedTabId)) {
        void crawlActiveTab();
      }
    };

    browser.tabs.onCreated.addListener(handleCreated);
    browser.tabs.onRemoved.addListener(handleRemoved);
    browser.tabs.onActivated.addListener(handleActivated);
    browser.tabs.onUpdated.addListener(handleUpdated);

    // Follows the site's own light/dark toggle live: content.ts broadcasts
    // `syncMode` whenever the page flips its `dark` class. Guard by the
    // active tabId so mode changes from background tabs are ignored.
    const unsubscribeSyncMode = onMessage('syncMode', (message) => {
      if (message.sender?.tab?.id !== tabId) return;
      store.setMode(message.data);
    });

    return () => {
      browser.tabs.onCreated.removeListener(handleCreated);
      browser.tabs.onRemoved.removeListener(handleRemoved);
      browser.tabs.onActivated.removeListener(handleActivated);
      browser.tabs.onUpdated.removeListener(handleUpdated);
      unsubscribeSyncMode();
    };
  });
</script>

<PanelHeader showModeToggle={status === 'ready' && darkSupported} />

<main class={cn('min-h-screen')}>
  {#if status === 'loading'}
    <div
      class="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground"
    >
      Loading theme…
    </div>
  {:else if status === 'unavailable'}
    <div
      class="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground"
    >
      {unavailableMessage}
    </div>
  {:else if status === 'unsupported'}
    <div class="flex flex-1 flex-col gap-2 items-center justify-center p-6 text-center">
      <p class="text-sm font-medium text-foreground">No shadcn/ui tokens found</p>
      <p class="text-sm text-muted-foreground">
        This site doesn't define the core shadcn/ui theme tokens (such as
        <code class="text-xs">--background</code>, <code class="text-xs">--foreground</code>, and
        <code class="text-xs">--primary</code>), so there's nothing for Kromo to edit here.
      </p>
    </div>
  {:else}
    <div class="flex-1 overflow-y-auto">
      <Accordion type="single" value={groups[0].group} class={cn('py-1')}>
        {#each groups as g (g.group)}
          <AccordionItem value={g.group} class={cn('px-1')}>
            <AccordionTrigger class={cn('px-3')}>
              {g.label}
            </AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-1 pt-1 px-1">
                {#each g.tokens as token (token.cssVar)}
                  <TokenRow {token} onEdited={scheduleApply} />
                {/each}
              </div>
            </AccordionContent>
          </AccordionItem>
        {/each}
      </Accordion>
    </div>
  {/if}
</main>

<PanelFooter
  ready={status === 'ready'}
  onExport={() => (showExport = true)}
  onImport={() => (showImport = true)}
  onReset={handleReset}
/>

{#if showExport}
  <ExportDialog onClose={() => (showExport = false)} />
{/if}

{#if showImport}
  <ImportDialog onClose={() => (showImport = false)} onSubmit={handleImportSubmit} />
{/if}
