"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

export default function CommandInput({ value, onChange, onKeyDown }: {
  value: string; onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);
  const [idle, setIdle] = useState(true);
  const [cursor, setCursor] = useState({ x: 0, selection: false });
  const [composing, setComposing] = useState(false);

  function syncCursor() {
    const field = input.current;
    const ruler = measure.current;
    if (!field || !ruler) return;
    ruler.textContent = field.value.slice(0, field.selectionStart ?? field.value.length);
    setCursor({ x: ruler.getBoundingClientRect().width - field.scrollLeft, selection: field.selectionStart !== field.selectionEnd });
  }
  function activity() {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 650);
  }
  useLayoutEffect(syncCursor, [value]);
  useEffect(() => {
    const observer = new ResizeObserver(syncCursor);
    if (input.current) observer.observe(input.current);
    let mounted = true;
    document.fonts.ready.then(() => { if (mounted) syncCursor(); });
    return () => { mounted = false; observer.disconnect(); if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, []);

  return <span className="command-input-wrap" data-focused={focused} data-idle={idle}>
    <input id="command-input" ref={input} value={value}
      onChange={event => { activity(); onChange(event.target.value); }}
      onKeyDown={event => { if (event.key !== "Tab") activity(); onKeyDown(event); }}
      onFocus={() => { setFocused(true); syncCursor(); }}
      onBlur={() => { setFocused(false); setIdle(true); if (idleTimer.current) clearTimeout(idleTimer.current); }}
      onSelect={syncCursor} onScroll={syncCursor}
      onCompositionStart={() => setComposing(true)} onCompositionEnd={() => { setComposing(false); syncCursor(); }}
      placeholder="Type a command..." autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="keyboard-hints"
      style={{ caretColor: composing ? "var(--green)" : "transparent" }} />
    <span className="cursor-measure" ref={measure} aria-hidden="true" />
    <span className="input-block-cursor" aria-hidden="true" style={{ left: cursor.x, visibility: cursor.selection || composing || cursor.x < 0 ? "hidden" : "visible" }} />
  </span>;
}
