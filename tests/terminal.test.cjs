// Component state/effect checks without a browser. Visual layout and native
// selection/focus still require browser QA (see README).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
let current, reduced = false, now = 0, timerId = 0;
const timers = new Map();
const storage = new Map();
global.window = {
  matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }),
  setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, at: now + delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
};
global.document = { documentElement: { dataset: {} } };
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const hooks = {
  ...React,
  useState(initial) {
    const h = current, i = h.cursor++;
    if (!(i in h.slots)) h.slots[i] = typeof initial === 'function' ? initial() : initial;
    return [h.slots[i], value => { h.slots[i] = typeof value === 'function' ? value(h.slots[i]) : value; }];
  },
  useRef(initial) { const h = current, i = h.cursor++; return h.slots[i] ||= { current: initial }; },
  useSyncExternalStore(_subscribe, snapshot) { return snapshot(); },
  useEffect(callback, deps) {
    const h = current, i = h.cursor++, prior = h.slots[i];
    if (!prior || deps.some((value, index) => !Object.is(value, prior.deps[index]))) {
      h.effects.push(() => { prior?.cleanup?.(); h.slots[i] = { deps, cleanup: callback() }; });
    }
  },
};
hooks.useLayoutEffect = hooks.useEffect;
const cache = new Map();
function load(file) {
  const full = path.resolve(file);
  if (cache.has(full)) return cache.get(full);
  const extra = file.endsWith('/terminal.tsx') ? '\nexport { resolve, Output };' : '';
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8') + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return hooks;
    if (name === '@/src/data/portfolio') return load('src/data/portfolio.ts');
    if (name.startsWith('./')) return load(path.join(path.dirname(full), name + '.tsx'));
    return require(name);
  }, module, module.exports);
  cache.set(full, module.exports);
  return module.exports;
}
function harness(Component, initialProps = {}) {
  const h = { cursor: 0, slots: [], effects: [], props: initialProps,
    render(props = h.props) {
      h.props = props; h.cursor = 0; h.effects = []; current = h;
      const tree = Component(props); current = null;
      for (const effect of h.effects) effect();
      return tree;
    },
    unmount() { for (const slot of h.slots) slot?.cleanup?.(); },
  };
  return h;
}
function nodes(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  for (const child of [node.props?.children].flat(Infinity)) nodes(child, predicate, found);
  return found;
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return [node.props?.children].flat(Infinity).map(text).join(' ');
}
function advance(h, milliseconds) {
  const end = now + milliseconds;
  for (;;) {
    const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
    if (!next || next[1].at > end) break;
    now = next[1].at; timers.delete(next[0]); next[1].fn(); h.render();
  }
  now = end;
}
const terminal = load('src/components/terminal.tsx');
const { default: Demo } = load('src/components/terminal-demo.tsx');
const { demos, projects } = load('src/data/portfolio.ts');
const Input = load('src/components/command-input.tsx').default;
const input = h => nodes(h.render(), node => node.type === Input)[0];
function submit(h, command) {
  input(h).props.onChange(command);
  nodes(h.render(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  return h.render();
}
function key(h, key, shiftKey = false) {
  let prevented = false;
  input(h).props.onKeyDown({ key, shiftKey, nativeEvent: {}, preventDefault() { prevented = true; } });
  return prevented;
}

test('registry resolves commands, rejects unexpected arguments, and uses published projects', () => {
  for (const command of ['help', 'whoami', 'projects', 'skills', 'resume', 'contact', 'clear', 'deploy', 'diagnose cinemesh', 'theme crt', 'theme default']) assert.equal(terminal.resolve(command).kind, command);
  for (const project of projects) assert.equal(terminal.resolve('project ' + project.slug).project, project);
  assert.equal(terminal.resolve('  DIAGNOSE   CINEMESH ').kind, 'diagnose cinemesh');
  for (const bad of ['__proto__', 'constructor', 'deploy now', 'diagnose unknown', 'theme bright', 'project unknown']) assert.equal(terminal.resolve(bad).kind, 'error');
  const help = text(terminal.Output({ result: terminal.resolve('help'), run() {} }));
  for (const label of ['Demos', 'Theme', 'diagnose cinemesh', 'theme crt']) assert.ok(help.includes(label));
  for (const demo of demos) assert.ok(text(terminal.Output({ result: terminal.resolve('project ' + demo.projectSlug), run() {} })).includes(demo.command));
});

test('autocomplete, history, draft restoration, and normal Tab navigation', () => {
  const h = harness(terminal.default, { children: null });
  submit(h, 'whoami'); submit(h, 'projects'); input(h).props.onChange('draft');
  key(h, 'ArrowUp'); assert.equal(input(h).props.value, 'projects');
  key(h, 'ArrowUp'); assert.equal(input(h).props.value, 'whoami');
  key(h, 'ArrowDown'); key(h, 'ArrowDown'); assert.equal(input(h).props.value, 'draft');
  for (const [prefix, complete] of [['dep', 'deploy'], ['diag', 'diagnose cinemesh'], ['theme c', 'theme crt'], ['theme d', 'theme default'], ['project ci', 'project cinemesh']]) {
    input(h).props.onChange(prefix); assert.equal(key(h, 'Tab'), true); assert.equal(input(h).props.value, complete); assert.equal(key(h, 'Tab'), false);
  }
  for (const value of ['', 'unknown']) { input(h).props.onChange(value); assert.equal(key(h, 'Tab'), false); }
  input(h).props.onChange('dep'); assert.equal(key(h, 'Tab', true), false);
  h.unmount();
});

test('explicit themes persist, restore, and tolerate blocked storage', () => {
  storage.clear();
  const h = harness(terminal.default, { children: null }); h.render();
  assert.equal(document.documentElement.dataset.terminalTheme, 'default');
  submit(h, 'theme crt'); assert.equal(storage.get('portfolio-theme'), 'crt'); h.unmount();
  const reload = harness(terminal.default, { children: null }); reload.render();
  assert.equal(document.documentElement.dataset.terminalTheme, 'crt');
  submit(reload, 'theme default'); assert.equal(storage.get('portfolio-theme'), 'default');
  const original = localStorage.setItem;
  localStorage.setItem = () => { throw Error('storage blocked'); };
  submit(reload, 'theme crt'); assert.equal(document.documentElement.dataset.terminalTheme, 'crt');
  localStorage.setItem = original; reload.unmount();
});

test('demos complete sequentially, announce stages, and finish deployment in 1.8 seconds', () => {
  reduced = false;
  for (const script of demos) {
    timers.clear(); now = 0;
    const h = harness(Demo, { script, active: true, run() {} });
    assert.ok(text(h.render()).includes(script.title));
    for (let stage = 0; stage < script.stages.length; stage++) {
      advance(h, script.stageDuration);
      assert.ok(text(h.render()).includes(script.stages[stage].output));
    }
    const tree = h.render();
    assert.ok(text(tree).includes('Simulation complete'));
    assert.ok(text(tree).replace(/\s+/g, ' ').includes('project ' + script.projectSlug));
    assert.equal(nodes(tree, n => n.props?.role === 'status').length, 1);
    assert.equal(timers.size, 0); h.unmount();
  }
  assert.equal(demos[0].stageDuration * demos[0].stages.length, 1800);
});

test('replacement cancels previous demo timers; clear removes output and unmount cancels timers', () => {
  const h = harness(terminal.default, { children: null });
  let tree = submit(h, 'deploy');
  let outputs = nodes(tree, n => n.type === terminal.Output);
  assert.equal(outputs[0].props.active, true);
  const demo = harness(Demo, { script: demos[0], active: true, run() {} }); demo.render();
  advance(demo, 600);
  tree = submit(h, 'diagnose cinemesh'); outputs = nodes(tree, n => n.type === terminal.Output);
  assert.equal(outputs[0].props.active, false); assert.equal(outputs[1].props.active, true);
  demo.render({ ...demo.props, active: false });
  const cancelled = text(demo.render()); advance(demo, 5000);
  assert.equal(text(demo.render()), cancelled); assert.ok(cancelled.includes('Simulation cancelled'));
  const next = harness(Demo, { script: demos[1], active: true, run() {} }); next.render();
  tree = submit(h, 'clear'); assert.equal(nodes(tree, n => n.type === terminal.Output).length, 0);
  next.unmount(); assert.equal(timers.size, 0);
  demo.unmount(); h.unmount();
});

test('reduced motion renders final stages immediately and settles running demos', () => {
  reduced = true;
  for (const script of demos) {
    const h = harness(Demo, { script, active: true, run() {} });
    const tree = h.render(); assert.ok(text(tree).includes('Simulation complete'));
    for (const stage of script.stages) assert.ok(text(tree).includes(stage.output));
    advance(h, 0); reduced = false;
    assert.ok(text(h.render()).includes('Simulation complete')); h.unmount(); reduced = true;
  }
  reduced = false;
  const running = harness(Demo, { script: demos[0], active: true, run() {} }); running.render();
  reduced = true; assert.ok(text(running.render()).includes('Simulation complete'));
  advance(running, 0); assert.equal(timers.size, 0); running.unmount(); reduced = false;
});

test('block cursor tracks selection and horizontal scrolling and becomes steady during typing', () => {
  const originalSet = global.setTimeout, originalClear = global.clearTimeout;
  global.setTimeout = window.setTimeout; global.clearTimeout = window.clearTimeout;
  global.ResizeObserver = class { observe() {} disconnect() {} };
  document.fonts = { ready: Promise.resolve() };
  const h = harness(Input, { value: 'deploy', onChange() {}, onKeyDown() {} });
  try {
    let tree = h.render();
    const field = nodes(tree, n => n.type === 'input')[0];
    const ruler = nodes(tree, n => n.props?.className === 'cursor-measure')[0];
    field.props.ref.current = { value: 'deploy', selectionStart: 3, selectionEnd: 3, scrollLeft: 10 };
    ruler.props.ref.current = { textContent: '', getBoundingClientRect() { return { width: this.textContent.length * 10 }; } };
    field.props.onFocus(); tree = h.render();
    assert.equal(tree.props['data-focused'], true);
    const caret = () => nodes(h.render(), n => n.props?.className === 'input-block-cursor')[0];
    assert.equal(caret().props.style.left, 20);
    field.props.onKeyDown({ key: 'ArrowLeft' }); assert.equal(h.render().props['data-idle'], false);
    advance(h, 650); assert.equal(h.render().props['data-idle'], true);
    field.props.ref.current.selectionEnd = 5; field.props.onSelect();
    assert.equal(caret().props.style.visibility, 'hidden');
    field.props.onBlur(); assert.equal(h.render().props['data-focused'], false);
  } finally {
    h.unmount(); global.setTimeout = originalSet; global.clearTimeout = originalClear;
  }
});
