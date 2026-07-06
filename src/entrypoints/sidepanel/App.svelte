<script lang="ts">
  import { onMount } from 'svelte';
  import { browser, type Browser } from 'wxt/browser';
  import { createThemeStore, setThemeStore } from '@/lib/theme-store.svelte';
  import { sendMessage } from '@/lib/messaging';
  import { loadOverrides, saveOverrides, clearOverrides } from '@/lib/storage';
  import { TOKENS, type TokenGroup } from '@/lib/tokens';
  import { originFromUrl } from '@/lib/url';
  import PanelHeader from './lib/PanelHeader.svelte';
  import TokenRow from './lib/TokenRow.svelte';
  import ExportDialog from './lib/ExportDialog.svelte';
  import ImportDialog from './lib/ImportDialog.svelte';

  const store = setThemeStore(createThemeStore());

  type Status = 'loading' | 'ready' | 'unavailable';

  let status = $state<Status>('loading');
  let unavailableMessage = $state('');
  let tabId = $state<number | undefined>(undefined);

  let showExport = $state(false);
  let showImport = $state(false);

  const GROUP_ORDER: TokenGroup[] = [
    'base',
    'card',
    'primary',
    'state',
    'border',
    'chart',
    'sidebar',
  ];
  const GROUP_LABELS: Record<TokenGroup, string> = {
    base: 'Base',
    card: 'Card & Popover',
    primary: 'Primary / Secondary / Muted / Accent',
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
        status = 'unavailable';
        unavailableMessage =
          "Kromo can't edit this page. Open a regular website tab to read and edit its theme.";
        return;
      }

      tabId = tab.id;

      const { theme: baseline } = await sendMessage('readTokens', undefined, tabId);
      const persisted = await loadOverrides(origin);
      store.loadTheme(origin, persisted ?? baseline);

      if (persisted) {
        await sendMessage('applyOverrides', persisted, tabId);
      }

      status = 'ready';
    } catch (error) {
      console.error('Kromo: failed to initialize sidepanel', error);
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

    const handleActivated = (activeInfo: Browser.tabs.OnActivatedInfo): void => {
      void (async () => {
        try {
          const tab = await browser.tabs.get(activeInfo.tabId);
          const origin = originFromUrl(tab.url);
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
      if (shouldRecrawl(origin, updatedTabId)) {
        void crawlActiveTab();
      }
    };

    browser.tabs.onActivated.addListener(handleActivated);
    browser.tabs.onUpdated.addListener(handleUpdated);

    return () => {
      browser.tabs.onActivated.removeListener(handleActivated);
      browser.tabs.onUpdated.removeListener(handleUpdated);
    };
  });
</script>

<div class="flex min-h-screen w-full flex-col bg-background text-foreground">
  <PanelHeader
    ready={status === 'ready'}
    onExport={() => (showExport = true)}
    onImport={() => (showImport = true)}
    onReset={handleReset}
  />

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
  {:else}
    <div class="flex-1 overflow-y-auto px-3 py-3">
      {#each groups as g (g.group)}
        <section class="mb-4 last:mb-0">
          <h2 class="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {g.label}
          </h2>
          <div class="flex flex-col gap-1.5">
            {#each g.tokens as token (token.cssVar)}
              <TokenRow {token} onEdited={scheduleApply} />
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>

{#if showExport}
  <ExportDialog onClose={() => (showExport = false)} />
{/if}

{#if showImport}
  <ImportDialog onClose={() => (showImport = false)} onSubmit={handleImportSubmit} />
{/if}
