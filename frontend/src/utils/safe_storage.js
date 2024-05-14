// Transparent wrapper over Window.localStorage
// Adheres to the Web Storage API:
// https://developer.mozilla.org/en-US/docs/Web/API/Storage

/**
 * Wraps localStorage.getItem in a try/catch. Return null
 * if the key does not exist or localStorage fails.
 */
function getItem(key: string): ?string {
  try {
    return localStorage.getItem(key) || null;
  } catch (err) {
    console.warn('Could not read from localStorage.');
    return null;
  }
}

/**
 * Wraps localStorage.setItem in a try/catch.
 */
function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn('Could not write to localStorage.');
  }
}

/**
 * Wraps localStorage.removeItem in a try/catch.
 */
function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Could not delete from localStorage.');
  }
}

export { getItem, setItem, removeItem };
