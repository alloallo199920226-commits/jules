import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { trackVisibleViewport } from './visible-viewport';

function fixture(withViewport = true) {
  let sequence = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const timers = new Map<number, () => void>();
  const properties = new Map<string, string>();
  const viewport = Object.assign(new EventTarget(), { height: 720, offsetTop: 0 });
  const view = Object.assign(new EventTarget(), {
    innerHeight: 720,
    parent: {},
    visualViewport: withViewport ? viewport : null,
    requestAnimationFrame(fn: FrameRequestCallback) { const id = ++sequence; frames.set(id, fn); return id; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
    setTimeout(fn: () => void) { const id = ++sequence; timers.set(id, fn); return id; },
    clearTimeout(id: number) { timers.delete(id); },
  });
  const doc = Object.assign(new EventTarget(), { defaultView: view });
  const element = {
    ownerDocument: doc,
    style: {
      setProperty(key: string, value: string) { properties.set(key, value); },
      removeProperty(key: string) { properties.delete(key); },
    },
  } as unknown as HTMLElement;
  const flush = () => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(fn => fn(0));
  };
  return { view, viewport, doc, element, properties, frames, timers, flush };
}

test('initial visible bounds fill the viewport', () => {
  const f = fixture(), stop = trackVisibleViewport(f.element);
  assert.equal(f.properties.get('--visible-viewport-height'), '720px');
  assert.equal(f.properties.get('--visible-viewport-top'), '0px');
  stop();
});

test('keyboard shrink and Safari pan are applied together', () => {
  const f = fixture(), stop = trackVisibleViewport(f.element);
  f.viewport.height = 410; f.viewport.offsetTop = 230;
  f.viewport.dispatchEvent(new Event('resize'));
  f.viewport.dispatchEvent(new Event('scroll'));
  assert.equal(f.frames.size, 1, 'coalesce both events into one layout update');
  f.flush();
  assert.equal(f.properties.get('--visible-viewport-height'), '410px');
  assert.equal(f.properties.get('--visible-viewport-top'), '230px');
  stop();
});

test('a pan without a resize still moves the fixed surface', () => {
  const f = fixture(), stop = trackVisibleViewport(f.element);
  f.viewport.offsetTop = 180;
  f.viewport.dispatchEvent(new Event('scroll')); f.flush();
  assert.equal(f.properties.get('--visible-viewport-top'), '180px');
  stop();
});

test('focus settlement catches delayed keyboard geometry and restores on dismissal', () => {
  const f = fixture(), stop = trackVisibleViewport(f.element);
  f.doc.dispatchEvent(new Event('focusin'));
  f.flush();
  f.viewport.height = 380; f.viewport.offsetTop = 200;
  [...f.timers.values()].forEach(fn => fn()); f.flush();
  assert.equal(f.properties.get('--visible-viewport-height'), '380px');
  f.viewport.height = 720; f.viewport.offsetTop = 0;
  f.viewport.dispatchEvent(new Event('resize')); f.flush();
  assert.equal(f.properties.get('--visible-viewport-height'), '720px');
  assert.equal(f.properties.get('--visible-viewport-top'), '0px');
  stop();
});

test('without visualViewport use the document window height', () => {
  const f = fixture(false), stop = trackVisibleViewport(f.element);
  f.view.innerHeight = 500;
  f.view.dispatchEvent(new Event('resize')); f.flush();
  assert.equal(f.properties.get('--visible-viewport-height'), '500px');
  assert.equal(f.properties.get('--visible-viewport-top'), '0px');
  stop();
});

test('unmount removes bounds, delayed work and listeners', () => {
  const f = fixture(), stop = trackVisibleViewport(f.element);
  f.doc.dispatchEvent(new Event('focusin'));
  stop();
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.properties.size, 0);
  f.viewport.dispatchEvent(new Event('resize'));
  f.viewport.dispatchEvent(new Event('scroll'));
  f.view.dispatchEvent(new Event('scroll'));
  f.doc.dispatchEvent(new Event('focusin'));
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
});

// Exercise the actual public console viewport handler without authentication,
// browser access, sessions or any project secrets.
const adminSource = readFileSync(new URL('../../public/admin-ui/support-inbox.js', import.meta.url), 'utf8');
const handlerStart = adminSource.indexOf('const viewport=window.visualViewport,framed=');
const handlerEnd = adminSource.indexOf('const presencePath=', handlerStart);
assert(handlerStart >= 0 && handlerEnd > handlerStart);
const handlerSource = adminSource.slice(handlerStart, handlerEnd);

for (const framed of [false, true]) {
  test(`console viewport uses ${framed ? 'iframe-local' : 'standalone visible'} coordinates without double offset`, () => {
    const f = fixture();
    f.view.parent = framed ? {} : f.view;
    f.view.innerHeight = framed ? 410 : 720;
    f.viewport.height = 410;
    f.viewport.offsetTop = 230;
    const run = new Function('window', 'root', 'requestAnimationFrame', handlerSource);
    run(f.view, f.element, f.view.requestAnimationFrame.bind(f.view));
    assert.equal(f.properties.get('--support-console-height'), '410px');
    assert.equal(f.properties.get('--support-console-top'), framed ? '0px' : '230px');
  });
}
