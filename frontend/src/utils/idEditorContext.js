// @openstreetmap/id exposes itself through window.iD as an import side effect.
// Capture that reference at module scope after importing the package.
export function captureIdEditorPackage() {
  return window.iD;
}

// The OSM iD editor and the Sandbox editor keep their iD context on the redux
// store rather than recreating it on every mount — iD works better warm, and
// reopening the same task shouldn't need a page reload to see recently-saved
// edits. Keep the OSM and Sandbox contexts separate because they use different
// API endpoints and authentication. Each context is tagged with its editor type.
//
// This resolves the context for a mounting editor:
//  - same type as the stored context  → reuse it (stays warm, no reload)
//  - no stored context yet (fresh page load) → build a new tagged one
//  - a DIFFERENT type is stored (a cross-editor switch within a live SPA
//    session) → force a full page reload and return null. Initializing a
//    fresh context into the container mid-SPA-transition is unreliable (the
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
