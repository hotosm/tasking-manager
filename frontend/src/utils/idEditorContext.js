// Both @openstreetmap/id and @osm-sandbox/sandbox-id have no real ESM/CJS
// exports — each only assigns itself to window.iD as a side effect on
// import, and whichever loaded last wins that global for the rest of the
// session. Call this at module scope, immediately after importing a
// package's own module, so it captures that package's own reference before
// the other one can overwrite the global.
export function captureIdEditorPackage() {
  return window.iD;
}

// The OSM iD editor and the Sandbox editor keep their iD context on the redux
// store rather than recreating it on every mount — iD works better warm, and
// reopening the same task shouldn't need a page reload to see recently-saved
// edits. But the two editors can't share a context: they're built by different
// iD forks, so a context from the other editor is missing methods it never
// calls (e.g. Sandbox's own `.license()`). Each context is tagged with who
// built it.
//
// This resolves the context for a mounting editor:
//  - same type as the stored context  → reuse it (stays warm, no reload)
//  - no stored context yet (fresh page load) → build a new tagged one
//  - a DIFFERENT type is stored (a cross-editor switch within a live SPA
//    session) → force a full page reload and return null. Initializing a
//    fresh fork into the container mid-SPA-transition is unreliable (the
//    task's own features sometimes never load until a manual reload), whereas
//    a full reload lands back on the same task+editor via the URL and
//    initializes cleanly — the one path that always works. On that reload the
//    store is empty, so we take the "build a new one" branch, not this one.
export function resolveIdEditorContext(existingContext, editorType, buildContext) {
  if (existingContext) {
    if (existingContext.__idEditorType === editorType) {
      return existingContext;
    }
    window.location.reload();
    return null;
  }
  const context = buildContext();
  context.__idEditorType = editorType;
  return context;
}
