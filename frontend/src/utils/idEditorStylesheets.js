// @openstreetmap/id and @osm-sandbox/sandbox-id each ship a stylesheet that,
// once loaded as part of the Editor/SandboxEditor lazy chunk, is never
// unloaded for the rest of the page session. Both stylesheets style the same
// shared ".ideditor" root class, so once a user has opened both editor types
// in one session, whichever stylesheet loaded most recently can leak
// conflicting rules into the other editor. Only one of the two editors is
// ever mounted at a time, so tag each package's <link> as it loads and keep
// only the active one's stylesheet enabled.
const ATTR = 'data-id-editor-pkg';

// Call once, at module scope, immediately after importing a package's own
// CSS file. Webpack defers running a lazy chunk's JS until its <link> has
// loaded, so at this exact point the tag we're looking for is reliably the
// most recently appended stylesheet link.
export function registerIdEditorStylesheet(key) {
  const link = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).pop();
  if (link) link.setAttribute(ATTR, key);
}

export function activateIdEditorStylesheet(key) {
  document.querySelectorAll(`link[${ATTR}]`).forEach((link) => {
    link.disabled = link.getAttribute(ATTR) !== key;
  });
}
