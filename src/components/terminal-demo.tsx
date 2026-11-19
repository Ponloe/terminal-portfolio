"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { DemoScript } from "@/src/data/portfolio";

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false);
}

export default function TerminalDemo({ script, active, run }: {
  script: DemoScript; active: boolean; run: (command: string) => void;
}) {
  const reduced = useReducedMotion();
  const [completed, setCompleted] = useState(0);
  const total = script.stages.length;
  const progress = reduced ? total : completed;

  useEffect(() => {
    if (!active || completed >= total) return;
    // Persist the final state if reduced motion is enabled during playback.
    const timer = window.setTimeout(() => setCompleted(reduced ? total : completed + 1), reduced ? 0 : script.stageDuration);
    return () => window.clearTimeout(timer);
  }, [active, completed, reduced, script.stageDuration, total]);

  const finished = progress >= total;
  const cancelled = !active && !finished;
  const update = finished ? "Simulation complete."
    : cancelled ? "Simulation cancelled."
    : progress ? `${script.stages[progress - 1].title}: OK. ${script.stages[progress].title}.`
    : `${script.stages[0].title}.`;

  return <section className="demo-output" aria-label={script.title}>
    <h2>{script.title}</h2>
    <p className="muted">{script.notice}</p>
    {script.opening && <pre className="demo-sample">{script.opening}</pre>}
    <ol className="demo-stages">
      {script.stages.map((stage, index) => index <= progress && <li key={stage.title}>
        <p><span className="stage-marker" aria-hidden="true">{index < progress ? "[OK]" : cancelled ? "[--]" : <span className="ascii-spinner">{["|", "/", "-", "\\"].map((frame, i) => <span key={i}>{frame}</span>)}</span>}</span><span className="sr-only">{index < progress ? "Completed: " : cancelled ? "Cancelled: " : "In progress: "}</span>{stage.title}</p>
        {index < progress && <pre className="demo-sample">{stage.output}</pre>}
      </li>)}
    </ol>
    {finished && <><p className="accent">Simulation complete</p><button className="project-command" onClick={() => run(`project ${script.projectSlug}`)}>project {script.projectSlug}</button></>}
    {cancelled && <p className="muted">Simulation cancelled.</p>}
    <p className="sr-only" role="status" aria-atomic="true">{active ? `${script.title}: ${update}` : ""}</p>
  </section>;
}
