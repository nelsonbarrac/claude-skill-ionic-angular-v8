# Ionic Angular v8 — Claude Code Skill

A [Claude Code](https://claude.com/claude-code) skill for building **Ionic Framework v8** apps in **Angular (standalone)** with precise, verified component APIs.

It gives the model:

- A concise `SKILL.md` with v8 standalone conventions (imports, `imports: []`, controllers, icons).
- Precise per-component API reference for **all 95 `ion-*` components** — props (with resolved union types), defaults, events, methods, CSS variables, slots, and shadow parts.
- Domain guides: project setup, overlays (controller vs inline), forms, navigation, and theming.

The API data is generated from `@ionic/core` v8's `dist/docs.json` (Stencil's `docs-json` output), so props/types/defaults are exact — not guessed.

## What's inside

```
ionic-angular-v8/            # ← the skill (copy this into your skills dir)
├── SKILL.md
└── references/
    ├── index.md             # 95 components → standalone import, controller, ref file
    ├── components/<slug>.md  # precise per-component API
    └── guides/
        ├── setup.md
        ├── overlays.md
        ├── forms.md
        ├── navigation.md
        └── theming.md
tools/gen.js                 # regenerator (see "Updating")
```

## Install

Skills live in `~/.claude/skills/` (available in **all** projects) or `<project>/.claude/skills/` (that project only).

### Option A — global (recommended)

```bash
git clone git@github.com:nelsonbarrac/claude-skill-ionic-angular-v8.git /tmp/ionic-skill
cp -r /tmp/ionic-skill/ionic-angular-v8 ~/.claude/skills/
rm -rf /tmp/ionic-skill
```

### Option B — single project

```bash
git clone git@github.com:nelsonbarrac/claude-skill-ionic-angular-v8.git /tmp/ionic-skill
mkdir -p .claude/skills
cp -r /tmp/ionic-skill/ionic-angular-v8 .claude/skills/
rm -rf /tmp/ionic-skill
```

### Verify

Start Claude Code and run `/` — you should see `ionic-angular-v8` in the skills list. It auto-triggers on Ionic Angular work (`ion-*`, `@ionic/angular/standalone`, overlays, forms, routing).

## Usage

No command needed. When you ask Claude Code to write or review Ionic Angular v8 code, the skill activates, reads only the component reference files it needs (progressive disclosure — the 95 files do **not** all load into context), and uses exact APIs.

## Updating (new Ionic version)

The reference files are generated. To regenerate for a future Ionic version:

```bash
mkdir ionic-extract && cd ionic-extract
npm init -y
npm install @ionic/core@<version> @ionic/angular@<version>
cp /path/to/this-repo/tools/gen.js .
node gen.js ~/.claude/skills/ionic-angular-v8
```

`gen.js` reads `@ionic/core/dist/docs.json` for the API and parses standalone export
names from `@ionic/angular/standalone` (`directives/proxies.d.ts` + `index.d.ts`).

## License & attribution

- Skill content and guides: **Apache-2.0** (see `LICENSE`).
- Per-component API data is derived from [`@ionic/core`](https://github.com/ionic-team/ionic-framework), which is **MIT licensed** © Ionic. This skill redistributes that documentation data for tooling purposes.
