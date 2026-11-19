import { profile, projects } from "@/src/data/portfolio";
import Terminal from "@/src/components/terminal";

export default function Home() {
  return <main className="workspace">
    <header className="masthead"><span><span className="accent">~/</span> soponloe<span className="muted"> / portfolio</span></span><span className="edition">CLOUD INFRASTRUCTURE & OPERATIONS</span></header>
    <section className="terminal-window" aria-label="Interactive portfolio terminal">
      <div className="titlebar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>soponloe@portfolio: ~</span><span className="shell-label">portfolio.sh</span></div>
      <div className="terminal-body">
        <Terminal>
          <div className="welcome-startup">
            <label className="welcome-motion-control">
              <input type="checkbox" id="pause-welcome-motion" /> Pause welcome animations
            </label>
            <div className="startup-log" aria-hidden="true">
              <span><span className="accent">[ ok ]</span> load profile</span>
              <span><span className="accent">[ ok ]</span> index {projects.length} project entries</span>
              <span><span className="accent">[ ok ]</span> ready for commands<span className="startup-trail">_</span></span>
            </div>
            <div className="boot-line"><span className="accent">[ ready ]</span> A little about me. A closer look at my work.</div>
            <section className="intro" aria-labelledby="name">
              <div className="intro-copy">
                <p className="eyebrow">HELLO, WORLD. I’M</p>
                <h1 id="name">{profile.name}<span className="cursor welcome-cursor" aria-hidden="true">_</span></h1>
                <p className="role">Computer science graduate <span aria-hidden="true">/</span> Cloud engineer</p>
                <p className="intro-description">{profile.introduction}</p>
              </div>
              <pre className="server-art" aria-hidden="true">{`      .----------.\n     /__________/|\n     |  _  _  `}<span className="server-led led-one">o</span>{` | |\n     |----------| |\n     |  _  _  `}<span className="server-led led-two">o</span>{` | |\n     |----------| |\n     |  _  _  `}<span className="server-led led-three">o</span>{` | /\n     '----------'\n       |  |  |\n    ---'  |  '---\n          `}<span className="server-signal">|</span></pre>
            </section>
          </div>
        </Terminal>
      </div>
    </section>
  </main>;
}
