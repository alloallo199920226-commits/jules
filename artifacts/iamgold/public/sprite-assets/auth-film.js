(() => {
  const film = document.querySelector('.auth-film');
  if (!film) return;

  film.muted = true;
  film.defaultMuted = true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const syncPlayback = () => {
    if (document.hidden || reducedMotion.matches || navigator.connection?.saveData) {
      film.pause();
      return;
    }
    film.play().catch(() => {
      // Autoplay may be restricted; the poster stays visible as the fallback.
      film.pause();
    });
  };

  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener?.('change', syncPlayback);
  syncPlayback();
})();