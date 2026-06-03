/* Generates per-component Angular v8 standalone API reference from @ionic/core docs.json */
const fs = require('fs');
const path = require('path');

const docs = require('./node_modules/@ionic/core/dist/docs.json');
const standaloneIdx = fs.readFileSync(
  './node_modules/@ionic/angular/standalone/index.d.ts',
  'utf8'
);

const OUT = process.argv[2];
const COMP_DIR = path.join(OUT, 'references', 'components');
fs.mkdirSync(COMP_DIR, { recursive: true });

// Set of exported standalone names (components + controllers)
const exportedNames = new Set();
// Named exports in the standalone barrel
for (const m of standaloneIdx.matchAll(/export\s*(?:type\s+)?\{([^}]*)\}/g)) {
  m[1].split(',').forEach((n) => {
    const id = n.trim().split(/\s+as\s+/)[0].trim();
    if (id) exportedNames.add(id);
  });
}
for (const m of standaloneIdx.matchAll(/export\s*(?:declare\s+)?const\s+(\w+)/g)) {
  exportedNames.add(m[1]);
}
// Component proxy classes (the bulk: IonButton, IonCard, ...)
const proxies = fs.readFileSync(
  './node_modules/@ionic/angular/standalone/directives/proxies.d.ts',
  'utf8'
);
for (const m of proxies.matchAll(/export\s+(?:declare\s+)?class\s+(Ion\w+)/g)) {
  exportedNames.add(m[1]);
}

const pascal = (tag) =>
  'Ion' + tag.replace(/^ion-/, '').split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');

// Controllers available as DI providers (overlays/utilities)
const CONTROLLERS = {
  'ion-alert': 'AlertController',
  'ion-action-sheet': 'ActionSheetController',
  'ion-toast': 'ToastController',
  'ion-loading': 'LoadingController',
  'ion-modal': 'ModalController',
  'ion-popover': 'PopoverController',
  'ion-picker': 'PickerController',
  'ion-menu': 'MenuController',
};

const esc = (s) => (s || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
const code = (s) => (s ? '`' + s.replace(/`/g, '').replace(/\|/g, '\\|') + '`' : '');

function propType(p) {
  const r = p.complexType && p.complexType.resolved;
  return r && r.length < 120 ? r : p.type;
}

function table(headers, rows) {
  if (!rows.length) return '_None._\n';
  return (
    '| ' + headers.join(' | ') + ' |\n' +
    '| ' + headers.map(() => '---').join(' | ') + ' |\n' +
    rows.map((r) => '| ' + r.join(' | ') + ' |').join('\n') + '\n'
  );
}

const index = [];

for (const c of docs.components) {
  const tag = c.tag;
  const name = pascal(tag);
  const isStandaloneComp = exportedNames.has(name);
  const controller = CONTROLLERS[tag];
  const slug = tag.replace(/^ion-/, '');
  index.push({ tag, name, slug, controller: controller || '' });

  let md = `# ${tag}\n\n`;
  md += `> Angular v8 standalone API reference. Generated from @ionic/core ${docs.compiler.version} docs.json.\n\n`;
  if (c.docs) md += `${c.docs.split('\n')[0]}\n\n`;
  md += `- **Encapsulation:** ${c.encapsulation}\n`;

  // Imports
  md += `\n## Import (standalone)\n\n`;
  const imports = [];
  if (isStandaloneComp) imports.push(name);
  if (controller) imports.push(controller);
  if (imports.length) {
    md += '```ts\n';
    md += `import { ${imports.join(', ')} } from '@ionic/angular/standalone';\n`;
    md += '```\n';
    if (isStandaloneComp) {
      md += `\nAdd \`${name}\` to the component's \`imports: []\` array.\n`;
    }
    if (controller) {
      md += `\nInject \`${controller}\` via constructor DI to present \`${tag}\` programmatically.\n`;
    }
  } else {
    md += `\n_Not a directly importable standalone component. Used as a sub-element of a parent component._\n`;
  }

  // Props
  md += `\n## Properties\n\n`;
  md += table(
    ['Prop', 'Attribute', 'Type', 'Default', 'Description'],
    c.props.map((p) => [
      code(p.name),
      code(p.attr || ''),
      code(propType(p)),
      code(p.default || ''),
      esc(p.docs),
    ])
  );

  // Events
  md += `\n## Events\n\n`;
  md += table(
    ['Event', 'Detail', 'Description'],
    c.events.map((e) => [code(e.event), code(e.detail), esc(e.docs)])
  );

  // Methods
  md += `\n## Methods\n\n`;
  md += table(
    ['Method', 'Signature', 'Description'],
    c.methods.map((m) => [code(m.name), code(m.signature), esc(m.docs)])
  );

  // Slots
  md += `\n## Slots\n\n`;
  md += table(
    ['Slot', 'Description'],
    c.slots.map((s) => [code(s.name || '(default)'), esc(s.docs)])
  );

  // Parts
  md += `\n## CSS Shadow Parts\n\n`;
  md += table(
    ['Part', 'Description'],
    c.parts.map((p) => [code(p.name), esc(p.docs)])
  );

  // CSS custom properties
  md += `\n## CSS Custom Properties\n\n`;
  const seen = new Map();
  for (const s of c.styles) {
    if (!seen.has(s.name)) seen.set(s.name, s.docs);
  }
  md += table(
    ['Variable', 'Description'],
    [...seen.entries()].map(([n, d]) => [code(n), esc(d)])
  );

  // Dependencies
  if (c.dependencies && c.dependencies.length) {
    md += `\n## Renders sub-components\n\n${c.dependencies.map((d) => code(d)).join(', ')}\n`;
  }

  fs.writeFileSync(path.join(COMP_DIR, `${slug}.md`), md);
}

// Index file
let idx = `# Ionic Angular v8 — Component API Index\n\n`;
idx += `${index.length} components. Open \`references/components/<slug>.md\` for precise props/events/methods/CSS vars.\n\n`;
idx += '| Component | Standalone import | Controller (DI) | Reference |\n| --- | --- | --- | --- |\n';
for (const e of index.sort((a, b) => a.tag.localeCompare(b.tag))) {
  const imp = exportedNames.has(e.name) ? '`' + e.name + '`' : '_(sub-element)_';
  idx += `| \`${e.tag}\` | ${imp} | ${e.controller ? '`' + e.controller + '`' : '—'} | [${e.slug}](components/${e.slug}.md) |\n`;
}
fs.writeFileSync(path.join(OUT, 'references', 'index.md'), idx);

console.log(`Generated ${index.length} component refs + index at ${OUT}`);
