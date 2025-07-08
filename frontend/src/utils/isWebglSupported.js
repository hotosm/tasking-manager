// https://maplibre.org/maplibre-gl-js/docs/examples/check-for-support/
export default function isWebglSupported() {
  if (window.WebGLRenderingContext) {
    const canvas = document.createElement('canvas');
    try {
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (context && typeof context.getParameter == 'function') {
        return true;
      }
    } catch (e) {
      console.log(e);
      // WebGL is supported, but disabled
    }
    return false;
  }
  // WebGL not supported
  return false;
}
