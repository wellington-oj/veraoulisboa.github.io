window.LabMode = (() => {
  const STORAGE_KEY = 'veraoLabMode';

  function readUrlMode() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'facilitator' || mode === 'student') return mode;
    return null;
  }

  function getMode() {
    const fromUrl = readUrlMode();
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(STORAGE_KEY) || 'student';
  }

  const mode = getMode();

  return {
    mode,
    isFacilitator: mode === 'facilitator',
    isStudent: mode !== 'facilitator',
  };
})();
