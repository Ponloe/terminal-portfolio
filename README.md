# Soponloe Sovann — terminal portfolio

A Next.js App Router + TypeScript portfolio with a browser-only terminal. The page shell, introduction, metadata, and VT323 font are rendered at build time. A focused Client Component handles commands and interaction. No shell commands are executed.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Node.js 20.9+ is required. The first development run and production build need access to Google Fonts; `next/font/google` downloads VT323 and self-hosts it in the output.

## Update content

Edit `src/data/portfolio.ts`:

- `profile`: introduction, degree, contact links, and résumé. Add only verified links, e.g. `{ label: "Email", href: "mailto:YOUR_EMAIL" }`, plus supplied GitHub and LinkedIn URLs.
- `projects`: the published entries used by the project list, detail commands, and autocomplete. Keep their order here. Optional `architecture`, `incident`, and `measurements` fields stay hidden until populated. Add the actual traffic path and recovery details, a CineMesh incident, and research measurements when available.
- `skills`: distinguish `handsOn` from `learning` in each group. Empty fields do not imply experience; container experience and learning areas await confirmation.

Missing links are omitted. No project URLs, incident details, quantitative outcomes, or credentials have been invented.

## Add a résumé

Place the actual PDF at `public/resume.pdf`, then set `profile.resume` to `{ label: "Résumé", href: "/resume.pdf" }`. This enables the shortcut and view/download links. Keep the value `null` until the file exists.

## Build and deploy

```sh
npm run build
```

`next.config.ts` uses `output: "export"`. Upload the entire generated `out/` directory to static hosting. Use `npm run build` as the hosting build command and `out` as the publish directory. No Node.js server is needed in production; `next start` does not serve static exports. To preview the export locally:

```sh
python3 -m http.server 3000 --directory out
```

These defaults expect deployment at a domain root. For subpath hosting, configure Next.js `basePath` and prefix the résumé path accordingly before rebuilding.

## Interaction verification

- Type `help`, `whoami`, `projects`, `skills`, `resume`, and `contact`; submit with Enter or the enter button.
- Click every shortcut and every project command. Compare output with typed commands.
- Open `project digitalocean-deployment`, `project cinemesh`, and `project vm-consolidation`.
- Try an unknown command, unknown slug, extra arguments, and whitespace-only input.
- Use Up/Down to recall commands and restore an unfinished draft. `clear` removes the displayed history while preserving recall and shortcuts.
- Try Tab on `he` and `project ci`. Tab on empty, unmatched, or complete input and Shift+Tab must preserve focus navigation.
- Check focus indicators and the latest-output live announcement with a screen reader.
- The terminal fits the viewport, with a scrollable output pane and pinned shortcuts/input. New commands scroll only the output pane to the latest response; long responses start at their heading.
- At 320px and 375px widths, check titles, commands, prompt, and output for horizontal overflow. Run several commands and confirm the prompt and window stay in place; scroll back through earlier output.

Browser interaction and mobile visual QA require an available browser session. The source includes responsive layouts and accessible labels, but automated static checks cannot replace those checks.

## Terminal demos and appearance

- `deploy`: a 1.8-second simulated deployment associated with the DigitalOcean project.
- `diagnose cinemesh`: an illustrative service-status, logs, and curl walkthrough.
- `theme crt` / `theme default`: switch appearance and save the explicit choice in `localStorage` (`portfolio-theme`). First-time visitors see the standard theme. Storage failures do not prevent switching themes for the current visit.

These commands are listed under **Demos** and **Theme** in `help` and supported by Tab completion. Each related project also links to its demo; the main shortcut row remains focused on portfolio content.

Edit the `demos` array in `src/data/portfolio.ts` to change sample output. The CineMesh example is explicitly fictional and separate from the real `project.incident` field. No demo executes commands, makes requests, deploys anything, or checks live services.

The input uses a decorative block caret over a native text input. It tracks the insertion point and pauses blinking while typing or unfocused; selecting text hides the block. Project lists reveal over 250ms; long project details appear immediately. Reduced-motion preferences disable fades and cursor blinking and display completed demo stages immediately. Starting another demo cancels the previous one; `clear` unmounts demos and clears their timers. Spinner frames are decorative and are not announced.

### Automated state checks

```sh
node --test tests/terminal.test.cjs
```

These tests exercise the command registry and component state/effect logic with controlled timers and browser API substitutes, including cancellation, reduced motion, theme restoration, and cursor position/selection. They are not browser rendering tests.

### Browser checks still to perform

- At 320px and 375px widths, run both demos and check sample output wrapping, fixed prompt position, and internal scrolling.
- Type, select text, navigate with arrows/Home/End, and horizontally scroll a long input; verify the block tracks the native insertion position. Blur the input to stop blinking.
- Run `theme crt`, reload, and verify persistence. Run `theme default` and reload again. Check selection and clicking through the scanline overlay.
- Enable reduced motion before running commands, and toggle it during a demo. Output should immediately finish without fades, spinner animation, or cursor blinking.
- Run `deploy`, immediately run `clear`, and wait longer than two seconds. Nothing should reappear. Start `diagnose cinemesh` during deployment and confirm the prior demo stops.
- With a screen reader, verify stage updates are announced without spinner frames and keyboard focus remains visible.

### Welcome animation

On arrival, a brief decorative startup log reveals in sequence, followed by the welcome copy. The ASCII server lights, signal, and welcome cursors loop continuously from arrival. The “Pause welcome animations” checkbox stops these decorative loops; unchecking it resumes them. The entrance text reveals only once. Shortcut hover/focus glow adds feedback afterward. These are CSS-only effects on server-rendered content: the prompt is usable immediately, content space stays reserved, and reduced motion shows everything without animation. Tune the `startup-*`, `welcome-*`, and `server-*` rules in `app/globals.css`.

## Docker and automatic Docker Hub publishing

The Docker image builds the static export with Node.js and serves it with Nginx on port 80.

```sh
docker build -t terminal-portfolio .
docker run --rm -p 3000:80 terminal-portfolio
```

Open http://localhost:3000. The image build needs internet access for npm packages and Google Fonts.

To enable publishing:

1. Create a Docker Hub repository named `terminal-portfolio` under your Docker Hub username.
2. Create a Docker Hub personal access token with write permission for the repository.
3. In this GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** and add `DOCKERHUB_USERNAME` (your Docker Hub username) and `DOCKERHUB_TOKEN` (the token). Your Docker Hub username may differ from your GitHub username. Never commit the token.
4. Commit and push these files. The **Publish Docker image** workflow runs on every push and can also be run manually from the Actions tab.

Images are published as `YOUR_DOCKERHUB_USERNAME/terminal-portfolio`. Every push gets a branch or tag name and a `sha-<full-commit-hash>` tag. Only the default branch updates `latest`. Both Linux AMD64 and ARM64 images are published.

Run the published image:

```sh
docker run --rm -p 3000:80 YOUR_DOCKERHUB_USERNAME/terminal-portfolio:latest
```

Publishing an image does not automatically update a running container; pull the new image and recreate your container to deploy it.
