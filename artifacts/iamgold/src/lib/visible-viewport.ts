/**
 * A fixed chat must follow both dimensions of Safari's visual viewport:
 * its visible height AND its offset after the keyboard pans the page.
 * Coordinates always belong to the element's own document.
 */
export function trackVisibleViewport(
  element: HTMLElement,
  onResize?: (height: number, layoutHeight: number) => void,
) {
  const doc = element.ownerDocument;
  const view = doc.defaultView;
  if (!view) return () => {};
  const viewport = view.visualViewport;
  let frame: number | null = null;
  let disposed = false;
  const timers = new Set<number>();

  const measure = () => {
    frame = null;
    if (disposed) return;
    const height = Math.max(1, Math.round(viewport?.height ?? view.innerHeight));
    const top = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
    element.style.setProperty('--visible-viewport-height', `${height}px`);
    element.style.setProperty('--visible-viewport-top', `${top}px`);
    onResize?.(height, view.innerHeight);
  };
  const schedule = () => {
    if (!disposed && frame === null) frame = view.requestAnimationFrame(measure);
  };
  const settleFocus = () => {
    schedule();
    // Safari can pan the page after focus and after the keyboard animation.
    for (const delay of [100, 350]) {
      const timer = view.setTimeout(() => {
        timers.delete(timer);
        schedule();
      }, delay);
      timers.add(timer);
    }
  };
  measure();
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  view.addEventListener('resize', schedule);
  view.addEventListener('scroll', schedule, { passive: true });
  view.addEventListener('orientationchange', settleFocus);
  doc.addEventListener('focusin', settleFocus);
  doc.addEventListener('focusout', settleFocus);

  return () => {
    disposed = true;
    if (frame !== null) view.cancelAnimationFrame(frame);
    timers.forEach(timer => view.clearTimeout(timer));
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    view.removeEventListener('resize', schedule);
    view.removeEventListener('scroll', schedule);
    view.removeEventListener('orientationchange', settleFocus);
    doc.removeEventListener('focusin', settleFocus);
    doc.removeEventListener('focusout', settleFocus);
    element.style.removeProperty('--visible-viewport-height');
    element.style.removeProperty('--visible-viewport-top');
  };
}
