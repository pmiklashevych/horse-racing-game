function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

export function isLocalStorageSupported(): boolean {
  if (!hasWindow() || !('localStorage' in window)) {
    return false;
  }

  try {
    const probeKey = '__horse-racing-storage-probe__';
    window.localStorage.setItem(probeKey, probeKey);
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export function isIndexedDbSupported(): boolean {
  return hasWindow() && typeof window.indexedDB !== 'undefined';
}
