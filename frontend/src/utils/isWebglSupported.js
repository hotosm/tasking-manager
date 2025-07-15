// https://maplibre.org/maplibre-gl-js/docs/examples/check-for-support/
let cachedSupport = null;

export default function isWebglSupported() {
  if (cachedSupport !== null) return cachedSupport;

  if (window.WebGLRenderingContext) {
    const canvas = document.createElement('canvas');
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (context && typeof context.getParameter === 'function') {
        cachedSupport = true;
        return true;
      }
    } catch (e) {
      console.log(e);
    }
  }

  cachedSupport = false;
  return false;
}
