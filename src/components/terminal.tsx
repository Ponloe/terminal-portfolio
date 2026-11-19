"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { profile, projects, skills, demos, type Project } from "@/src/data/portfolio";

import CommandInput from "./command-input";
import TerminalDemo from "./terminal-demo";

const registry = {
  help: "Show available commands", whoami: "Get to know me", projects: "Explore featured work",
  project: "Open a project: project <slug>", skills: "View tools and hands-on experience",
  resume: "View or download my résumé", contact: "Find my contact links", clear: "Clear the terminal output",
  deploy: "Simulate a deployment — no live changes",
  "diagnose cinemesh": "Explore a sample troubleshooting walkthrough",
  "theme crt": "Enable faint scanlines and a soft green glow",
  "theme default": "Restore the standard terminal theme",
} as const;
type Command = keyof typeof registry;
type Result = { kind: Command; project?: Project } | { kind: "error"; message: string };
const prompt = "soponloe@portfolio:~$";
function resolve(value: string): Result {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (Object.hasOwn(registry, normalized) && normalized !== "project") return { kind: normalized as Command };
  const [command, ...args] = normalized.split(" ");
  if (!Object.hasOwn(registry, command)) return { kind: "error", message: `Command not found: ${command}. Type help to explore.` };
  if (command === "project") {
    const project = projects.find((entry) => entry.slug === args.join(" "));
    return project ? { kind: "project", project } : { kind: "error", message: "Project not found. Use projects to see available slugs." };
  }
  if (args.length) return { kind: "error", message: `Usage: ${command}. Type help for available commands.` };
  return { kind: command as Command };
}
function Output({ result, run, active = false }: { result: Result; run: (command: string) => void; active?: boolean }) {
  switch (result.kind) {
    case "error": return <p className="error">{result.message}</p>;
    case "help": return <><h2>Available commands</h2>{["Portfolio", "Demos", "Theme"].map(group => <section className="help-group" key={group}><h3>{group}</h3><div className="help-list">{Object.entries(registry).filter(([command]) => (command.startsWith("theme ") ? "Theme" : demos.some(demo => demo.command === command) ? "Demos" : "Portfolio") === group).map(([command, description]) => <div key={command}><button onClick={() => run(command === "project" ? "projects" : command)}>{command === "project" ? "project <slug>" : command}</button><span>{description}</span></div>)}</div></section>)}</>;
    case "deploy":
    case "diagnose cinemesh": return <TerminalDemo script={demos.find(demo => demo.command === result.kind)!} active={active} run={run} />;
    case "theme crt": return <p>CRT theme enabled. Use <button onClick={() => run("theme default")}>theme default</button> to restore the standard theme.</p>;
    case "theme default": return <p>Standard terminal theme restored.</p>;
    case "whoami": return <><h2>{profile.name}</h2><p className="accent">{profile.degree}</p><p>{profile.introduction}</p></>;
    case "projects": return <><div className="output-heading"><h2>Featured projects</h2><span className="muted">{projects.length} entries</span></div><div className="project-list">{projects.map(project => <article key={project.slug}><div className="project-meta"><span>{project.category}</span><time>{project.date}</time></div><h3>{project.title}</h3><p>{project.summary}</p><button className="project-command" onClick={() => run(`project ${project.slug}`)}><span aria-hidden="true">$ </span>project {project.slug}</button></article>)}</div></>;
    case "project": {
      const project = result.project!;
      return <article className="project-detail"><div className="project-meta"><span>{project.category}</span><time>{project.date}</time></div><h2>{project.title}</h2><p className="stack">{project.stack.join(" · ")}</p><h3>Purpose</h3><p>{project.purpose}</p><h3>What I implemented</h3><ul>{project.contributions.map(text => <li key={text}>{text}</li>)}</ul>{project.architecture && <><h3>Architecture & recovery</h3><p>{project.architecture}</p></>}<h3>{project.slug === "cinemesh" ? "Troubleshooting & verification" : "Verification & evaluation"}</h3><ul>{project.verification.map(text => <li key={text}>{text}</li>)}</ul>{project.incident && <><h3>Incident walkthrough</h3><p>{project.incident}</p></>}{project.measurements && <><h3>Measurements</h3><p>{project.measurements}</p></>}{project.links.map(link => <a className="content-link" key={link.href} href={link.href}>{link.label}</a>)}{demos.filter(demo => demo.projectSlug === project.slug).map(demo => <p className="project-demo-link" key={demo.command}><span className="muted">Browser simulation / </span><button onClick={() => run(demo.command)}>{demo.command}</button></p>)}<button onClick={() => run("projects")}>[ all projects ]</button></article>;
    }
    case "skills": return <><h2>Skills & tools</h2><p className="muted">Hands-on experience from the work above. Learning areas are listed separately when available.</p><div className="skills-list">{skills.map(skill => <section key={skill.group}><h3>{skill.group}</h3>{skill.handsOn.length > 0 && <p><span className="accent">Hands-on / </span>{skill.handsOn.join(" · ")}</p>}{skill.learning.length > 0 && <p><span className="accent">Learning / </span>{skill.learning.join(" · ")}</p>}{!skill.handsOn.length && !skill.learning.length && <p className="muted">No experience listed yet.</p>}</section>)}</div></>;
    case "resume": return profile.resume ? <><h2>Résumé</h2><a className="content-link" href={profile.resume.href}>View résumé</a><a className="content-link" href={profile.resume.href} download>Download résumé</a></> : <p>My résumé is not available here yet. Explore projects to see my work.</p>;
    case "contact": return <><h2>Contact</h2>{profile.links.length ? profile.links.map(link => <a className="content-link" key={link.href} href={link.href}>{link.label}</a>) : <p>Contact links have not been added yet.</p>}</>;
    case "clear": return null;
  }
}

export default function Terminal({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ id: number; command: string; result: Result }[]>([]);
  const [recall, setRecall] = useState<string[]>([]);
  const [position, setPosition] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState<{ id: number; content: ReactNode } | null>(null);
  const [activeDemo, setActiveDemo] = useState<number | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio-theme");
      document.documentElement.dataset.terminalTheme = saved === "crt" ? "crt" : "default";
    } catch { /* Standard theme remains usable when storage is unavailable. */ }
  }, []);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const latestEntryRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    const latestEntry = latestEntryRef.current;
    // Scroll only the output pane. Start long responses at their heading so
    // visitors can read them in order; the prompt never moves with the output.
    transcript.scrollTop = latestEntry
      ? transcript.scrollTop + latestEntry.getBoundingClientRect().top - transcript.getBoundingClientRect().top
      : 0;
  }, [history]);
  function run(raw: string) {
    const command = raw.trim();
    if (!command) return;
    const result = resolve(command);
    const id = ++nextId.current;
    setRecall(previous => [...previous, command]);
    setPosition(null); setInput(""); setDraft("");
    const isDemo = demos.some(demo => demo.command === result.kind);
    if (result.kind === "clear" || isDemo) setActiveDemo(isDemo ? id : null);
    if (result.kind === "theme crt" || result.kind === "theme default") {
      const theme = result.kind === "theme crt" ? "crt" : "default";
      document.documentElement.dataset.terminalTheme = theme;
      try { localStorage.setItem("portfolio-theme", theme); } catch { /* The theme still works for this visit. */ }
    }
    if (result.kind === "clear") setHistory([]);
    else setHistory(previous => [...previous, { id, command, result }]);
    setAnnouncement({ id, content: isDemo ? "Browser simulation started. Sample output only." : result.kind === "clear" ? "Terminal output cleared." : <Output result={result} run={() => {}} /> });
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowUp" && recall.length) {
      event.preventDefault();
      if (position === null) setDraft(input);
      const next = position === null ? recall.length - 1 : Math.max(0, position - 1);
      setPosition(next); setInput(recall[next]);
    } else if (event.key === "ArrowDown" && position !== null) {
      event.preventDefault();
      const next = position + 1;
      setPosition(next >= recall.length ? null : next); setInput(next >= recall.length ? draft : recall[next]);
    } else if (event.key === "Tab" && !event.shiftKey && input.trim()) {
      const value = input.toLowerCase();
      const candidates = [...Object.keys(registry), ...projects.map(project => `project ${project.slug}`)];
      const match = candidates.find(candidate => candidate.startsWith(value) && candidate !== value);
      if (match && !candidates.includes(value)) { event.preventDefault(); setInput(match); setPosition(null); }
    }
  }
  return <div className="interactive">
    <div className="transcript" ref={transcriptRef} role="region" tabIndex={0} aria-label="Terminal output and command history">
      {children}
      {history.map((entry, index) => <section className="history-entry" ref={index === history.length - 1 ? latestEntryRef : undefined} key={entry.id}><p className="command-echo"><span>{prompt}</span> {entry.command}</p><div className={`output response-${entry.result.kind.replaceAll(" ", "-")}`}><Output result={entry.result} run={run} active={activeDemo === entry.id} /></div></section>)}
    </div>
    <nav className="shortcuts" aria-label="Portfolio commands"><span className="muted">Explore</span>{["projects", "skills", ...(profile.resume ? ["resume"] : []), "contact"].map(command => <button key={command} onClick={() => run(command)}><span aria-hidden="true">./</span>{command}</button>)}<button className="help-shortcut" onClick={() => run("help")}>help <span aria-hidden="true">?</span></button></nav>
    <form className="command-form" onSubmit={event => { event.preventDefault(); run(input); }}>
      <label className="prompt" htmlFor="command-input">{prompt}</label><label className="sr-only" htmlFor="command-input">Portfolio command</label>
      <CommandInput value={input} onChange={value => { setInput(value); setPosition(null); }} onKeyDown={onKeyDown} />
      <button className="run-button" type="submit" aria-label="Run command">enter ↵</button>
    </form>
    <div className="terminal-hints" id="keyboard-hints"><span>Try <button onClick={() => run("help")}>help</button> or click a command above.</span><span><kbd>↑</kbd><kbd>↓</kbd> history <span className="hint-gap"><kbd>tab</kbd> autocomplete</span></span></div>
    <div className="sr-only" aria-live="polite" aria-atomic="true"><div key={announcement?.id}>{announcement?.content}</div></div>
  </div>;
}
