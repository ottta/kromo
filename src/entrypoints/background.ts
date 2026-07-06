export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Chrome: open the side panel when the toolbar icon is clicked.
  // Without this, clicking the icon does nothing.
  browser.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});
