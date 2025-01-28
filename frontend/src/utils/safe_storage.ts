// Transparent wrapper over Window.localStorage
// Adheres to the Web Storage API:
// https://developer.mozilla.org/en-US/docs/Web/API/Storage

/**
 * Wraps localStorage.getItem in a try/catch. Return null
 * if the key does not exist or localStorage fails.
 */
function getItem(key: string) {
  try {
    const gotKey = localStorage.getItem(key);
    if (gotKey === null) {
      return null;
    }
    return JSON.parse(gotKey) as unknown;
  } catch {
    console.warn('Could not read from localStorage.');
    return null;
  }
}

/**
 * Wraps localStorage.setItem in a try/catch.
 */
function setItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('Could not write to localStorage.');
  }
}

/**
 * Wraps localStorage.removeItem in a try/catch.
 */
function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn('Could not delete from localStorage.');
  }
}

export { getItem, setItem, removeItem };
