const backgroundsWithFilteredImagery = new WeakSet();
const unavailableImagerySourceIds = new Set(['OpenAerialMapMosaic']);

// Both iD editors still include the retired Kontur OAM imagery source.
// Wrap each background instance once so the unavailable source is hidden,
// while preserving every argument expected by iD's source lookup.
export function removeUnavailableImagerySources(background) {
  if (
    !background ||
    typeof background.sources !== 'function' ||
    backgroundsWithFilteredImagery.has(background)
  ) {
    return;
  }

  const originalSources = background.sources.bind(background);
  background.sources = (...args) =>
    originalSources(...args).filter((source) => !unavailableImagerySourceIds.has(source.id));
  backgroundsWithFilteredImagery.add(background);
}

// @openstreetmap/id exposes itself through window.iD as an import side effect.
// Capture that reference at module scope after importing the package.
export function captureIdEditorPackage() {
  return window.iD;
}

// OSM and Sandbox keep separate iD contexts, reused warm when the type matches.
// A cross-editor switch reloads the page: mid-SPA init leaves task features unloaded.
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
