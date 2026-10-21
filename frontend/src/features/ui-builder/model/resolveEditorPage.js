/** Resolve only pages in the currently loaded tenant/application version. */
export function resolveEditorPage({ routePageId, pages = [], selectedPageId }) {
  return pages.find((page) => page.id === routePageId)
    || pages.find((page) => page.id === selectedPageId)
    || pages[0]
    || null;
}
