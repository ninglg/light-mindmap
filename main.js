'use strict';

const obsidian = require('obsidian');

const THEMES = {
  vibrant: {
    name: 'Vibrant',
    palette: ['#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399', '#22D3EE', '#60A5FA', '#A78BFA', '#F472B6', '#F43F5E', '#10B981', '#0EA5E9'],
    rootGrad: 'linear-gradient(135deg, #6366F1, #8B5CF6 60%, #EC4899)',
    bg: '#FFFFFF', fg: '#1F2937',
    tint1: 'rgba(99,102,241,0.08)', tint2: 'rgba(236,72,153,0.08)',
    rootAccent: '#8B5CF6'
  },
  classic: {
    name: 'Classic',
    palette: ['#19807E', '#383B70', '#A05A2C', '#7B9BC6', '#C47A82', '#3A8A8C', '#B85C5C', '#5D6D7E', '#8B7355', '#4A6B8A', '#9C6B4F', '#6B7A8F'],
    rootGrad: 'linear-gradient(135deg, #FFD613, #FFB800 60%, #F59E0B)',
    bg: '#FFFEF6', fg: '#1F2937',
    tint1: 'rgba(255,214,19,0.10)', tint2: 'rgba(255,184,0,0.06)',
    rootAccent: '#FFB800'
  },
  fresh: {
    name: 'Fresh',
    palette: ['#10B981', '#22D3EE', '#84CC16', '#14B8A6', '#06B6D4', '#34D399', '#A3E635', '#0EA5E9', '#65A30D', '#0891B2', '#16A34A', '#0D9488'],
    rootGrad: 'linear-gradient(135deg, #10B981, #14B8A6 60%, #0EA5E9)',
    bg: '#F0FDF4', fg: '#0F172A',
    tint1: 'rgba(16,185,129,0.10)', tint2: 'rgba(34,211,238,0.08)',
    rootAccent: '#10B981'
  },
  ocean: {
    name: 'Ocean',
    palette: ['#0EA5E9', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#0891B2', '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#0E7490', '#1E40AF'],
    rootGrad: 'linear-gradient(135deg, #0284C7, #2563EB 60%, #4F46E5)',
    bg: '#EFF6FF', fg: '#0F172A',
    tint1: 'rgba(14,165,233,0.10)', tint2: 'rgba(99,102,241,0.08)',
    rootAccent: '#2563EB'
  },
  sunset: {
    name: 'Sunset',
    palette: ['#F43F5E', '#F97316', '#FBBF24', '#EF4444', '#EC4899', '#FB923C', '#F59E0B', '#DC2626', '#DB2777', '#EA580C', '#D97706', '#BE185D'],
    rootGrad: 'linear-gradient(135deg, #F97316, #F43F5E 60%, #EC4899)',
    bg: '#FFF7ED', fg: '#1F2937',
    tint1: 'rgba(249,115,22,0.10)', tint2: 'rgba(244,63,94,0.08)',
    rootAccent: '#F43F5E'
  },
  midnight: {
    name: 'Midnight',
    palette: ['#22D3EE', '#A78BFA', '#F472B6', '#34D399', '#FBBF24', '#60A5FA', '#FB923C', '#F87171', '#10B981', '#A3E635', '#8B5CF6', '#0EA5E9'],
    rootGrad: 'linear-gradient(135deg, #1799F3, #FF7722 60%, #FFD07C)',
    bg: '#202531', fg: '#E2E8F0',
    tint1: 'rgba(23,153,243,0.12)', tint2: 'rgba(255,119,34,0.08)',
    rootAccent: '#1799F3'
  },
  slate: {
    name: 'Slate',
    palette: ['#38BDF8', '#818CF8', '#22D3EE', '#2DD4BF', '#A78BFA', '#34D399', '#67E8F9', '#C084FC', '#5EEAD4', '#7DD3FC', '#93C5FD', '#6EE7B7'],
    rootGrad: 'linear-gradient(135deg, #0EA5E9, #6366F1 60%, #8B5CF6)',
    bg: '#2C3341', fg: '#CBD5E1',
    tint1: 'rgba(14,165,233,0.10)', tint2: 'rgba(99,102,241,0.08)',
    rootAccent: '#6366F1'
  }
};

const DEFAULT_THEME = 'vibrant';

const LINE_STYLES = {
  curve: { name: 'Smooth', shape: 'curve', dash: null },
  straight: { name: 'Straight', shape: 'straight', dash: null },
  polyline: { name: 'Right Angle', shape: 'polyline', dash: null },
  'polyline-dashed': { name: 'Right Angle Dashed', shape: 'polyline', dash: '6 4' },
  'curve-dashed': { name: 'Smooth Dashed', shape: 'curve', dash: '6 4' }
};

const DEFAULT_LINE = 'curve';

const NODE_STYLES = {
  rounded: { name: 'Rounded' },
  square: { name: 'Square' },
  borderless: { name: 'Borderless' },
  circle: { name: 'Pill' },
  doodle: { name: 'Doodle' }
};

const DEFAULT_NODE_STYLE = 'rounded';

const HGAP = 64;
const VGAP = 18;
const ROOT_HGAP = 90;
const PAD = 60;
const PLACEHOLDER = 'New Title';

class LightMindMapPlugin extends obsidian.Plugin {
  async onload() {
    this._scan = obsidian.debounce(() => this._doScan(), 120);

    this.registerEvent(this.app.workspace.on('file-open', () => this._scan()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this._scan()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this._scan()));
    this.registerEvent(this.app.workspace.on('editor-change', () => this._scan()));
    this.registerEvent(this.app.metadataCache.on('changed', () => this._scan()));

    this.addCommand({
      id: 'lmm-toggle-source',
      name: 'Toggle mindmap / source view',
      callback: () => {
        const v = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!v) return;
        const o = v.contentEl.querySelector(':scope > .lmm-overlay');
        if (!o) return;
        if (o.classList.contains('lmm-hidden')) {
          o.classList.remove('lmm-hidden');
          this._removeRestoreFab(v);
        } else {
          o.classList.add('lmm-hidden');
          this._showRestoreFab(v, o);
        }
      }
    });

    this.addCommand({
      id: 'lmm-cycle-layout',
      name: 'Cycle mindmap layout (balanced / right / left)',
      callback: () => {
        const v = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!v) return;
        const o = v.contentEl.querySelector(':scope > .lmm-overlay');
        if (!o) return;
        const layouts = ['balanced', 'right', 'left'];
        const cur = o._lmmLayout || 'balanced';
        const next = layouts[(layouts.indexOf(cur) + 1) % layouts.length];
        o._lmmLayout = next;
        if (o._lmmTreeInfo) this._renderTreeIntoCanvas(o, false);
        this._persistFrontmatterValue(o._lmmFile, 'mindmap-layout', next);
      }
    });

    // Right-click menu: create new mindmap file in folder
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (!(file instanceof obsidian.TFolder)) return;
      menu.addItem((item) => {
        const lang = window.localStorage.getItem('language') || 'en';
        const title = lang.startsWith('zh') ? '新建轻量级脑图' : 'Create light mindmap';
        item
          .setTitle(title)
          .setIcon('brain')
          .onClick(async () => {
            const base = 'New Mindmap';
            let name = base + '.md';
            let i = 1;
            while (this.app.vault.getAbstractFileByPath(file.path + '/' + name)) {
              name = base + ' ' + (++i) + '.md';
            }
            const content = '---\ntype: mindmap\n---\n\n# New\n';
            const created = await this.app.vault.create(file.path + '/' + name, content);
            await this.app.workspace.openLinkText(created.path, '', true);
          });
      });
    }));

    this.app.workspace.onLayoutReady(() => this._doScan());

    // Inject SVG filter for doodle node style
    this._injectDoodleFilter();
  }

  onunload() {
    document.querySelectorAll('.lmm-overlay').forEach((el) => {
      if (el._lmmCleanup) el._lmmCleanup();
      el.remove();
    });
    document.querySelectorAll('.lmm-fab').forEach((el) => el.remove());
    const doodleSvg = document.getElementById('lmm-doodle-filter');
    if (doodleSvg) doodleSvg.closest('svg').remove();
  }

  async _doScan() {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof obsidian.MarkdownView)) continue;
      const file = view.file;
      if (!file) continue;
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache && cache.frontmatter;
      const isMindmap = fm && String(fm.type).toLowerCase() === 'mindmap';
      const existing = view.contentEl.querySelector(':scope > .lmm-overlay');

      if (isMindmap) {
        let content;
        try {
          content = view.editor ? view.editor.getValue() : await this.app.vault.cachedRead(file);
        } catch (e) {
          content = await this.app.vault.cachedRead(file);
        }
        let overlay = existing;
        if (!overlay) {
          overlay = view.contentEl.createDiv({ cls: 'lmm-overlay' });
        }
        if (overlay._lmmFile !== file) {
          overlay._lmmTheme = null;
          overlay._lmmLayout = null;
          overlay._lmmLine = null;
          overlay._lmmNodeStyle = null;
          overlay._lmmLastContent = null;
        }
        if (overlay._lmmLastContent === content) continue;
        if (overlay._lmmWriting && existing) {
          overlay._lmmLastContent = content;
          continue;
        }
        overlay.dataset.file = file.path;
        if (overlay.classList.contains('lmm-hidden')) {
          overlay._lmmNeedsRerender = true;
          overlay._lmmStaleContent = content;
          overlay._lmmStaleFm = fm;
          overlay._lmmStaleName = file.basename;
          continue;
        }
        try {
          this._render(overlay, content, fm, file.basename, view, file);
        } catch (e) {
          console.error('[LightMindMap] render error', e);
          overlay.empty();
          overlay.createDiv({ cls: 'lmm-empty', text: 'Mind map render error: ' + e.message });
        }
      } else if (existing) {
        existing.remove();
        this._removeRestoreFab(view);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Parsing — preserves frontmatter, pre-heading body, and each
  // heading's associated body so we can serialize back losslessly.
  // ────────────────────────────────────────────────────────────────

  _splitFrontmatter(content) {
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return { frontmatterRaw: '', frontmatter: null, body: content };
    let parsed = null;
    try { parsed = obsidian.parseYaml(m[1]) || {}; } catch (e) {}
    return { frontmatterRaw: m[0], frontmatter: parsed, body: content.slice(m[0].length) };
  }

  _stripInline(text) {
    return text
      .replace(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, p1, p2) => p2 || p1)
      .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
      .replace(/(^|[^_])_([^_\n]+)_/g, '$1$2')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/==([^=]+)==/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  _renderNodeContent(el, node, overlay) {
    const raw = node.rawText || node.text || '';
    if (!raw.includes('](')) {
      el.textContent = node.text || PLACEHOLDER;
      return;
    }
    el.textContent = '';
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0;
    let m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) {
        el.appendChild(document.createTextNode(raw.slice(last, m.index)));
      }
      const a = document.createElement('a');
      a.className = 'lmm-link';
      a.textContent = m[1];
      a.href = m[2];
      a.target = '_blank';
      a.rel = 'noopener';
      el.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < raw.length) {
      el.appendChild(document.createTextNode(raw.slice(last)));
    }
    if (el.childNodes.length === 0) {
      el.textContent = node.text || PLACEHOLDER;
    }
  }

  _parseStructured(content) {
    const { frontmatterRaw, body } = this._splitFrontmatter(content);
    const lines = body.split('\n');
    const headingRe = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
    const fenceRe = /^(```|~~~)/;
    let inFence = false;
    let fenceMarker = null;
    const headings = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fm = line.match(fenceRe);
      if (fm) {
        if (!inFence) { inFence = true; fenceMarker = fm[1]; }
        else if (line.startsWith(fenceMarker)) { inFence = false; fenceMarker = null; }
        continue;
      }
      if (inFence) continue;
      const m = line.match(headingRe);
      if (m) {
        const rawText = m[2].trim();
        const collapsed = /^\*(?!\*)(.+)\*(?!\*)$/.test(rawText);
        headings.push({
          srcIdx: i,
          level: m[1].length,
          rawText,
          text: this._stripInline(rawText),
          children: [],
          parent: null,
          dirty: false,
          isNew: false,
          collapsed,
          bodyRaw: '',
        });
      }
    }
    const preBody = headings.length > 0
      ? lines.slice(0, headings[0].srcIdx).join('\n')
      : lines.join('\n');
    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].srcIdx + 1;
      const end = i + 1 < headings.length ? headings[i + 1].srcIdx : lines.length;
      headings[i].bodyRaw = lines.slice(start, end).join('\n');
    }
    return { frontmatterRaw, preBody, headings };
  }

  _buildTree(parsed, fileName) {
    const items = parsed.headings;
    if (items.length === 0) return { tree: null, virtualRoot: false, baseLevel: 1 };
    const minLevel = items.reduce((a, b) => Math.min(a, b.level), 6);
    const tops = items.filter((i) => i.level === minLevel);

    let tree;
    let virtualRoot = false;
    const baseLevel = minLevel;

    if (tops.length > 1) {
      tree = {
        level: minLevel - 1,
        rawText: fileName || 'Mind Map',
        text: fileName || 'Mind Map',
        children: [],
        parent: null,
        bodyRaw: '',
        dirty: false,
        isNew: false,
        collapsed: false,
        isVirtual: true,
      };
      virtualRoot = true;
      const stack = [tree];
      for (const item of items) {
        while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
        if (stack.length === 0) stack.push(tree);
        const parent = stack[stack.length - 1];
        parent.children.push(item);
        item.parent = parent;
        stack.push(item);
      }
    } else {
      tree = items[0];
      tree.parent = null;
      const stack = [tree];
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
        const parent = stack[stack.length - 1] || tree;
        parent.children.push(item);
        item.parent = parent;
        stack.push(item);
      }
    }

    return { tree, virtualRoot, baseLevel };
  }

  // ────────────────────────────────────────────────────────────────
  // Serialization back to markdown.
  // Non-edited nodes write their original rawText; edited/new nodes
  // write node.text. Frontmatter, pre-body, and per-heading bodyRaw
  // are preserved verbatim.
  // ────────────────────────────────────────────────────────────────

  _serialize(parsed, treeInfo) {
    let out = parsed.frontmatterRaw;
    if (parsed.preBody && parsed.preBody.length) {
      out += parsed.preBody;
      if (!parsed.preBody.endsWith('\n')) out += '\n';
    }
    if (treeInfo.virtualRoot) {
      for (const child of treeInfo.tree.children) {
        out += this._serializeNode(child, treeInfo.baseLevel);
      }
    } else if (treeInfo.tree) {
      out += this._serializeNode(treeInfo.tree, treeInfo.baseLevel);
    }
    return out;
  }

  _serializeNode(node, level) {
    const cap = Math.min(6, Math.max(1, level));
    let text = node.rawText || node.text || PLACEHOLDER;
    if (node.collapsed) {
      const inner = text.replace(/^\*(?!\*)(.+)\*(?!\*)$/, '$1');
      text = '*' + inner + '*';
    } else {
      text = text.replace(/^\*(?!\*)(.+)\*(?!\*)$/, '$1');
    }
    let s = '#'.repeat(cap) + ' ' + text + '\n';
    if (node.bodyRaw && node.bodyRaw.length) {
      s += node.bodyRaw;
      if (!node.bodyRaw.endsWith('\n')) s += '\n';
    }
    for (const child of node.children) {
      s += this._serializeNode(child, level + 1);
    }
    return s;
  }

  _assignColors(root, palette, rootColor) {
    const p = (palette && palette.length) ? palette : THEMES[DEFAULT_THEME].palette;
    root.depth = 0;
    root.color = rootColor || p[0] || '#6366F1';
    root.children.forEach((child, i) => {
      const c = p[i % p.length];
      this._propagateColor(child, c, 1);
    });
  }

  _propagateColor(node, color, depth) {
    node.color = color;
    node.depth = depth;
    node.children.forEach((c) => this._propagateColor(c, color, depth + 1));
  }

  // ────────────────────────────────────────────────────────────────
  // Top-level render — toolbar + canvas containers, then renders
  // tree into the canvas.
  // ────────────────────────────────────────────────────────────────

  _showRestoreFab(view, overlay) {
    if (!view || !view.contentEl) return;
    let fab = view.contentEl.querySelector(':scope > .lmm-fab');
    if (fab) return;
    fab = view.contentEl.createEl('button', { cls: 'lmm-fab', text: 'Light Mindmap' });
    fab.onclick = () => {
      overlay.classList.remove('lmm-hidden');
      fab.remove();
      if (overlay._lmmNeedsRerender) {
        overlay._lmmNeedsRerender = false;
        this._render(overlay, overlay._lmmStaleContent, overlay._lmmStaleFm, overlay._lmmStaleName, view, view.file);
      } else {
        const canvas = overlay.querySelector(':scope > .lmm-canvas');
        const inner = canvas && canvas.querySelector(':scope > .lmm-inner');
        if (canvas && inner) this._fitTo(canvas, inner);
      }
    };
  }

  _removeRestoreFab(view) {
    if (!view || !view.contentEl) return;
    const fab = view.contentEl.querySelector(':scope > .lmm-fab');
    if (fab) fab.remove();
  }

  _resolveTheme(frontmatter) {
    const id = frontmatter && (frontmatter['mindmap-theme'] || frontmatter['mindmap_theme']);
    const key = id && THEMES[String(id).toLowerCase()] ? String(id).toLowerCase() : DEFAULT_THEME;
    return key;
  }

  _resolveLine(frontmatter) {
    const id = frontmatter && (frontmatter['mindmap-line'] || frontmatter['mindmap_line']);
    const key = id && LINE_STYLES[String(id).toLowerCase()] ? String(id).toLowerCase() : DEFAULT_LINE;
    return key;
  }

  _resolveNodeStyle(frontmatter) {
    const id = frontmatter && (frontmatter['mindmap-node'] || frontmatter['mindmap_node']);
    const key = id && NODE_STYLES[String(id).toLowerCase()] ? String(id).toLowerCase() : DEFAULT_NODE_STYLE;
    return key;
  }

  _applyNodeStyleToOverlay(overlay, nodeStyleId) {
    const key = NODE_STYLES[nodeStyleId] ? nodeStyleId : DEFAULT_NODE_STYLE;
    overlay._lmmNodeStyle = key;
    Object.keys(NODE_STYLES).forEach((id) => overlay.classList.remove('lmm-node-style-' + id));
    overlay.classList.add('lmm-node-style-' + key);
  }

  _applyThemeToOverlay(overlay, themeId) {
    const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
    overlay._lmmTheme = themeId in THEMES ? themeId : DEFAULT_THEME;
    Object.keys(THEMES).forEach((id) => overlay.classList.remove('lmm-theme-' + id));
    overlay.classList.add('lmm-theme-' + overlay._lmmTheme);
    if (theme.bg) overlay.style.setProperty('--lmm-theme-bg', theme.bg);
    else overlay.style.removeProperty('--lmm-theme-bg');
    if (theme.fg) overlay.style.setProperty('--lmm-theme-fg', theme.fg);
    else overlay.style.removeProperty('--lmm-theme-fg');
    overlay.style.setProperty('--lmm-theme-root-grad', theme.rootGrad);
    overlay.style.setProperty('--lmm-theme-root-accent', theme.rootAccent);
    overlay.style.setProperty('--lmm-theme-tint-1', theme.tint1);
    overlay.style.setProperty('--lmm-theme-tint-2', theme.tint2);
  }

  async _persistFrontmatterValue(file, key, value) {
    if (!file) return;
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        fm[key] = value;
      });
    } catch (e) {
      console.error('[LightMindMap] frontmatter persist error', e);
    }
  }

  async _batchPersistFrontmatter(file, updates) {
    if (!file || !updates || Object.keys(updates).length === 0) return;
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        for (const [key, value] of Object.entries(updates)) {
          fm[key] = value;
        }
      });
    } catch (e) {
      console.error('[LightMindMap] frontmatter batch persist error', e);
    }
  }

  _render(overlay, content, frontmatter, fileBasename, view, file) {
    overlay._lmmLastContent = content;
    overlay._lmmView = view;
    overlay._lmmFile = file;
    overlay._lmmFrontmatter = frontmatter;

    const fmLayout = frontmatter && (frontmatter['mindmap-layout'] || frontmatter['mindmap_layout'] || frontmatter.layout);
    const fmLayoutValid = fmLayout && ['balanced', 'right', 'left'].includes(String(fmLayout));
    const layout = overlay._lmmLayout || (fmLayoutValid ? String(fmLayout) : 'balanced');
    overlay._lmmLayout = layout;

    const fmTheme = frontmatter && (frontmatter['mindmap-theme'] || frontmatter['mindmap_theme']);
    const fmThemeValid = fmTheme && THEMES[String(fmTheme).toLowerCase()];
    const themeId = overlay._lmmTheme && THEMES[overlay._lmmTheme] ? overlay._lmmTheme : this._resolveTheme(frontmatter);
    this._applyThemeToOverlay(overlay, themeId);

    const fmLine = frontmatter && (frontmatter['mindmap-line'] || frontmatter['mindmap_line']);
    const fmLineValid = fmLine && LINE_STYLES[String(fmLine).toLowerCase()];
    const lineId = overlay._lmmLine && LINE_STYLES[overlay._lmmLine] ? overlay._lmmLine : this._resolveLine(frontmatter);
    overlay._lmmLine = lineId;

    const fmNodeStyle = frontmatter && (frontmatter['mindmap-node'] || frontmatter['mindmap_node']);
    const fmNodeStyleValid = fmNodeStyle && NODE_STYLES[String(fmNodeStyle).toLowerCase()];
    const nodeStyleId = overlay._lmmNodeStyle && NODE_STYLES[overlay._lmmNodeStyle] ? overlay._lmmNodeStyle : this._resolveNodeStyle(frontmatter);
    this._applyNodeStyleToOverlay(overlay, nodeStyleId);

    // Batch frontmatter writes into a single call to avoid cascading re-renders
    const fmUpdates = {};
    if (!fmLayoutValid) fmUpdates['mindmap-layout'] = layout;
    if (!fmThemeValid) fmUpdates['mindmap-theme'] = overlay._lmmTheme;
    if (!fmLineValid) fmUpdates['mindmap-line'] = lineId;
    if (!fmNodeStyleValid) fmUpdates['mindmap-node'] = overlay._lmmNodeStyle;
    if (Object.keys(fmUpdates).length) {
      this._batchPersistFrontmatter(file, fmUpdates);
    }

    const parsed = this._parseStructured(content);
    const treeInfo = this._buildTree(parsed, fileBasename);
    overlay._lmmParsed = parsed;
    overlay._lmmTreeInfo = treeInfo;
    overlay._lmmSelected = null;
    overlay._lmmPendingEdit = null;
    overlay._lmmEditingNode = null;

    if (overlay._lmmCleanup) overlay._lmmCleanup();
    overlay.empty();

    const toolbar = overlay.createDiv({ cls: 'lmm-toolbar' });
    const layoutGroup = toolbar.createDiv({ cls: 'lmm-toolbar-group' });
    layoutGroup.createSpan({ cls: 'lmm-toolbar-label', text: 'Layout' });
    const layoutBtns = {};
    for (const l of [{ id: 'balanced', label: 'Balanced' }, { id: 'right', label: 'Right' }, { id: 'left', label: 'Left' }]) {
      const btn = layoutGroup.createEl('button', {
        cls: 'lmm-btn' + (l.id === layout ? ' lmm-btn-active' : ''),
        text: l.label
      });
      btn.onclick = () => {
        if (overlay._lmmLayout === l.id) return;
        overlay._lmmLayout = l.id;
        Object.values(layoutBtns).forEach((b) => b.classList.remove('lmm-btn-active'));
        btn.classList.add('lmm-btn-active');
        this._renderTreeIntoCanvas(overlay, false);
        this._persistFrontmatterValue(file, 'mindmap-layout', l.id);
      };
      layoutBtns[l.id] = btn;
    }

    const themeGroup = toolbar.createDiv({ cls: 'lmm-toolbar-group' });
    themeGroup.createSpan({ cls: 'lmm-toolbar-label', text: 'Theme' });
    const themeSelect = themeGroup.createEl('select', { cls: 'lmm-select' });
    for (const id of Object.keys(THEMES)) {
      const opt = themeSelect.createEl('option', { value: id, text: THEMES[id].name });
      if (id === overlay._lmmTheme) opt.selected = true;
    }
    themeSelect.onchange = () => {
      const id = themeSelect.value;
      if (!THEMES[id] || id === overlay._lmmTheme) return;
      this._applyThemeToOverlay(overlay, id);
      if (overlay._lmmTreeInfo) this._renderTreeIntoCanvas(overlay, true);
      this._persistFrontmatterValue(file, 'mindmap-theme', id);
    };

    const lineGroup = toolbar.createDiv({ cls: 'lmm-toolbar-group' });
    lineGroup.createSpan({ cls: 'lmm-toolbar-label', text: 'Line' });
    const lineSelect = lineGroup.createEl('select', { cls: 'lmm-select' });
    for (const id of Object.keys(LINE_STYLES)) {
      const opt = lineSelect.createEl('option', { value: id, text: LINE_STYLES[id].name });
      if (id === overlay._lmmLine) opt.selected = true;
    }
    lineSelect.onchange = () => {
      const id = lineSelect.value;
      if (!LINE_STYLES[id] || id === overlay._lmmLine) return;
      overlay._lmmLine = id;
      if (overlay._lmmTreeInfo) this._renderTreeIntoCanvas(overlay, true);
      this._persistFrontmatterValue(file, 'mindmap-line', id);
    };

    const nodeGroup = toolbar.createDiv({ cls: 'lmm-toolbar-group' });
    nodeGroup.createSpan({ cls: 'lmm-toolbar-label', text: 'Node' });
    const nodeSelect = nodeGroup.createEl('select', { cls: 'lmm-select' });
    for (const id of Object.keys(NODE_STYLES)) {
      const opt = nodeSelect.createEl('option', { value: id, text: NODE_STYLES[id].name });
      if (id === overlay._lmmNodeStyle) opt.selected = true;
    }
    nodeSelect.onchange = () => {
      const id = nodeSelect.value;
      if (!NODE_STYLES[id] || id === overlay._lmmNodeStyle) return;
      this._applyNodeStyleToOverlay(overlay, id);
      if (overlay._lmmTreeInfo) this._renderTreeIntoCanvas(overlay, true);
      this._persistFrontmatterValue(file, 'mindmap-node', id);
    };

    const zoomGroup = toolbar.createDiv({ cls: 'lmm-toolbar-group' });
    zoomGroup.createSpan({ cls: 'lmm-toolbar-label', text: 'Zoom' });
    const fitBtn = zoomGroup.createEl('button', { cls: 'lmm-btn', text: 'Fit' });
    const zoomInBtn = zoomGroup.createEl('button', { cls: 'lmm-btn', text: '+' });
    const zoomOutBtn = zoomGroup.createEl('button', { cls: 'lmm-btn', text: '−' });

    const right = toolbar.createDiv({ cls: 'lmm-toolbar-group' });
    const exportBtn = right.createEl('button', { cls: 'lmm-btn', text: 'Export PNG' });
    exportBtn.onclick = () => this._exportPNG(overlay);
    const editBtn = right.createEl('button', { cls: 'lmm-btn lmm-btn-ghost', text: 'Edit Markdown' });
    editBtn.onclick = () => {
      overlay.classList.add('lmm-hidden');
      this._showRestoreFab(view, overlay);
    };

    if (!treeInfo.tree) {
      const empty = overlay.createDiv({ cls: 'lmm-empty' });
      empty.createDiv({ cls: 'lmm-empty-icon', text: '🧠' });
      const msg = empty.createDiv();
      msg.appendText('Add headings (e.g. ');
      msg.createEl('code', { text: '# Title' });
      msg.appendText(', ');
      msg.createEl('code', { text: '## Branch' });
      msg.appendText(') to render the mind map.');
      return;
    }

    const canvas = overlay.createDiv({ cls: 'lmm-canvas' });
    const inner = canvas.createDiv({ cls: 'lmm-inner' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'lmm-svg');
    inner.appendChild(svg);
    const nodesLayer = inner.createDiv({ cls: 'lmm-nodes' });
    canvas._lmm = { tx: 0, ty: 0, scale: 1 };

    overlay._lmmCanvas = canvas;
    overlay._lmmInner = inner;
    overlay._lmmSvg = svg;
    overlay._lmmNodesLayer = nodesLayer;

    this._bindPanZoom(canvas, inner, overlay);
    this._bindCanvasClick(canvas, overlay);

    fitBtn.onclick = () => this._fitTo(canvas, inner);
    zoomInBtn.onclick = () => this._zoomBy(canvas, inner, 1.2);
    zoomOutBtn.onclick = () => this._zoomBy(canvas, inner, 1 / 1.2);

    this._renderTreeIntoCanvas(overlay, false);
  }

  _renderTreeIntoCanvas(overlay, preserveTransform) {
    const canvas = overlay._lmmCanvas;
    const inner = overlay._lmmInner;
    const svg = overlay._lmmSvg;
    const nodesLayer = overlay._lmmNodesLayer;
    const treeInfo = overlay._lmmTreeInfo;
    const tree = treeInfo && treeInfo.tree;
    if (!tree || !canvas) return;

    const savedTransform = preserveTransform ? Object.assign({}, canvas._lmm) : null;

    nodesLayer.empty();
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const theme = THEMES[overlay._lmmTheme] || THEMES[DEFAULT_THEME];
    this._assignColors(tree, theme.palette, theme.rootAccent);
    this._createNodes(tree, nodesLayer, overlay);

    requestAnimationFrame(() => {
      this._measureNodes(tree);
      this._layoutTree(tree, overlay._lmmLayout, overlay);
      const bounds = this._computeBounds(tree);
      const w = bounds.maxX - bounds.minX + PAD * 2;
      const h = bounds.maxY - bounds.minY + PAD * 2;
      this._shiftTree(tree, PAD - bounds.minX, PAD - bounds.minY);
      this._applyNodePositions(tree);
      inner.style.width = w + 'px';
      inner.style.height = h + 'px';
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this._drawConnections(tree, svg, overlay._lmmLayout, overlay._lmmLine);

      if (savedTransform) {
        canvas._lmm = savedTransform;
        this._applyTransform(inner, savedTransform);
      } else {
        this._fitTo(canvas, inner);
      }

      if (overlay._lmmSelected && overlay._lmmSelected._el) {
        overlay._lmmSelected._el.classList.add('lmm-selected');
        overlay._lmmSelected._el.focus({ preventScroll: true });
      }
      if (overlay._lmmPendingEdit) {
        const node = overlay._lmmPendingEdit;
        overlay._lmmPendingEdit = null;
        if (node && node._el) this._startEdit(overlay, node);
      }
    });
  }

  _createNodes(node, layer, overlay) {
    const el = layer.createDiv({ cls: 'lmm-node lmm-node-d' + node.depth });
    if (node.depth === 0) el.classList.add('lmm-node-root');
    if (node.isVirtual) el.classList.add('lmm-node-virtual');
    if (node.collapsed && node.children.length) {
      el.classList.add('lmm-collapsed');
      el.title = node.children.length + ' hidden — Space to expand';
    }
    el.style.setProperty('--lmm-color', node.color);
    el.tabIndex = 0;
    if (node.collapsed && node.children.length) {
      const textSpan = document.createElement('span');
      textSpan.className = 'lmm-node-text';
      this._renderNodeContent(textSpan, node, overlay);
      el.appendChild(textSpan);
      const badge = document.createElement('span');
      badge.className = 'lmm-collapse-badge';
      el.appendChild(badge);
    } else {
      this._renderNodeContent(el, node, overlay);
    }
    node._el = el;
    this._attachNodeHandlers(el, node, overlay);
    if (node.collapsed && node.children.length) return;
    for (const child of node.children) this._createNodes(child, layer, overlay);
  }

  // ────────────────────────────────────────────────────────────────
  // Interaction: click to select, double-click to edit, keyboard
  // shortcuts for editing and structural changes.
  // ────────────────────────────────────────────────────────────────

  _attachNodeHandlers(el, node, overlay) {
    el.addEventListener('mousedown', (e) => {
      if (el.isContentEditable) return;
      e.stopPropagation();
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (el.isContentEditable) return;
      if (e.target.closest('.lmm-link')) return;
      this._selectNode(overlay, node, true);
    });
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this._startEdit(overlay, node);
    });
    el.addEventListener('keydown', (e) => {
      if (el.isContentEditable) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          const text = el.textContent;
          this._exitEditMode(overlay, node);
          this._updateNodeText(node, text);
          if (node.dirty) {
            this._persistAndRelayout(overlay);
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const text = el.textContent;
          this._exitEditMode(overlay, node);
          this._updateNodeText(node, text);
          this._addChild(overlay, node, true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this._cancelEdit(overlay, node);
        }
      } else {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (node.depth !== 0) this._addSibling(overlay, node, true);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          if (node.collapsed && node.children.length) {
            node.collapsed = false;
          }
          this._addChild(overlay, node, true);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          this._deleteNode(overlay, node);
        } else if (e.key === 'F2') {
          e.preventDefault();
          this._startEdit(overlay, node);
        } else if (e.key === ' ') {
          e.preventDefault();
          this._toggleCollapse(overlay, node);
        }
      }
    });
  }

  _selectNode(overlay, node, focus) {
    if (overlay._lmmSelected && overlay._lmmSelected !== node && overlay._lmmSelected._el) {
      overlay._lmmSelected._el.classList.remove('lmm-selected');
    }
    overlay._lmmSelected = node;
    if (node && node._el) {
      node._el.classList.add('lmm-selected');
      if (focus) node._el.focus({ preventScroll: false });
    }
  }

  _startEdit(overlay, node) {
    if (!node || !node._el) return;
    if (node.isVirtual) return;
    if (node.collapsed && node.children && node.children.length) {
      node.collapsed = false;
      overlay._lmmPendingEdit = node;
      this._persistAndRelayout(overlay);
      return;
    }
    const el = node._el;
    if (el.isContentEditable) return;
    if (overlay._lmmEditingNode && overlay._lmmEditingNode !== node) {
      this._cancelEdit(overlay, overlay._lmmEditingNode);
    }
    this._selectNode(overlay, node, false);
    overlay._lmmEditingNode = node;
    el.textContent = node.rawText || node.text || PLACEHOLDER;
    el.contentEditable = 'true';
    el.classList.add('lmm-editing');
    el.spellcheck = false;
    el.focus({ preventScroll: false });
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const onBlur = () => {
      el.removeEventListener('blur', onBlur);
      if (overlay._lmmEditingBlur === onBlur) overlay._lmmEditingBlur = null;
      if (!el.isContentEditable) return;
      const text = el.textContent;
      const had = node.rawText || node.text;
      this._exitEditMode(overlay, node);
      this._updateNodeText(node, text);
      if ((node.rawText || node.text) !== had) this._persistAndRelayout(overlay);
    };
    el.addEventListener('blur', onBlur);
    overlay._lmmEditingBlur = onBlur;
  }

  _exitEditMode(overlay, node) {
    const el = node._el;
    if (!el) return;
    if (overlay._lmmEditingBlur) {
      el.removeEventListener('blur', overlay._lmmEditingBlur);
      overlay._lmmEditingBlur = null;
    }
    el.contentEditable = 'false';
    el.classList.remove('lmm-editing');
    if (overlay._lmmEditingNode === node) overlay._lmmEditingNode = null;
    this._renderNodeContent(el, node, overlay);
  }

  _updateNodeText(node, newText) {
    const text = (newText || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const hadRaw = node.rawText || node.text;
    if (text !== hadRaw) {
      node.rawText = text;
      node.text = this._stripInline(text);
      node.dirty = true;
    }
  }

  _cancelEdit(overlay, node) {
    this._exitEditMode(overlay, node);
  }

  _toggleCollapse(overlay, node) {
    if (!node || !node.children || node.children.length === 0) return;
    const file = overlay._lmmFile;
    if (!file) return;
    node.collapsed = !node.collapsed;
    const newContent = this._serialize(overlay._lmmParsed, overlay._lmmTreeInfo);
    const selPath = overlay._lmmSelected ? this._pathFor(overlay._lmmSelected, overlay._lmmTreeInfo) : null;
    overlay._lmmLastContent = newContent;
    overlay._lmmParsed = this._parseStructured(newContent);
    overlay._lmmTreeInfo = this._buildTree(overlay._lmmParsed, file.basename);
    overlay._lmmSelected = selPath ? this._nodeAtPath(overlay._lmmTreeInfo, selPath) : null;
    this._renderTreeIntoCanvas(overlay, true);
    if (overlay._lmmSelected && overlay._lmmSelected._el) {
      overlay._lmmSelected._el.focus({ preventScroll: true });
    }
    overlay._lmmWriting = true;
    this.app.vault.modify(file, newContent).then(() => {
      requestAnimationFrame(() => { overlay._lmmWriting = false; });
    }).catch((e) => {
      overlay._lmmWriting = false;
      console.error('[LightMindMap] collapse persist error', e);
    });
  }

  _newNode(text) {
    return {
      text: text || PLACEHOLDER,
      rawText: text || PLACEHOLDER,
      children: [],
      parent: null,
      bodyRaw: '',
      dirty: true,
      isNew: true,
      collapsed: false,
      level: 0,
    };
  }

  _addSibling(overlay, node, edit) {
    const treeInfo = overlay._lmmTreeInfo;
    if (!node.parent) {
      // True root: promote to virtual root so we can add a sibling.
      if (!treeInfo.virtualRoot) {
        const oldRoot = treeInfo.tree;
        const fileName = (overlay._lmmFile && overlay._lmmFile.basename) || 'Mind Map';
        const virt = {
          rawText: fileName,
          text: fileName,
          children: [oldRoot],
          parent: null,
          bodyRaw: '',
          dirty: false,
          isNew: false,
          isVirtual: true,
        };
        oldRoot.parent = virt;
        treeInfo.tree = virt;
        treeInfo.virtualRoot = true;
        const newNode = this._newNode('');
        newNode.parent = virt;
        virt.children.push(newNode);
        overlay._lmmPendingEdit = edit ? newNode : null;
        this._persistAndRelayout(overlay);
        return;
      }
      return;
    }
    const parent = node.parent;
    const idx = parent.children.indexOf(node);
    const newNode = this._newNode('');
    newNode.parent = parent;
    parent.children.splice(idx + 1, 0, newNode);
    overlay._lmmPendingEdit = edit ? newNode : null;
    this._persistAndRelayout(overlay);
  }

  _addChild(overlay, node, edit) {
    const newNode = this._newNode('');
    newNode.parent = node;
    node.children.push(newNode);
    overlay._lmmPendingEdit = edit ? newNode : null;
    this._persistAndRelayout(overlay);
  }

  _deleteNode(overlay, node) {
    const treeInfo = overlay._lmmTreeInfo;
    if (!node) return;
    if (node.isVirtual) return;
    if (!node.parent) {
      new obsidian.Notice('Cannot delete the root node');
      return;
    }
    const parent = node.parent;
    const idx = parent.children.indexOf(node);
    if (idx >= 0) parent.children.splice(idx, 1);
    if (overlay._lmmSelected === node) overlay._lmmSelected = null;
    if (overlay._lmmEditingNode === node) overlay._lmmEditingNode = null;
    if (treeInfo.virtualRoot && treeInfo.tree.children.length === 1) {
      const sole = treeInfo.tree.children[0];
      sole.parent = null;
      treeInfo.tree = sole;
      treeInfo.virtualRoot = false;
    }
    if (treeInfo.virtualRoot && treeInfo.tree.children.length === 0) {
      const placeholder = this._newNode('');
      placeholder.parent = treeInfo.tree;
      treeInfo.tree.children.push(placeholder);
    }
    this._persistAndRelayout(overlay);
  }

  // ────────────────────────────────────────────────────────────────
  // Persist tree → markdown and rebuild canvas.
  // We re-parse our own output so each subsequent edit starts from a
  // clean structure (and so `bodyRaw` slots stay consistent).
  // ────────────────────────────────────────────────────────────────

  async _persistAndRelayout(overlay) {
    const file = overlay._lmmFile;
    if (!file) return;
    const newContent = this._serialize(overlay._lmmParsed, overlay._lmmTreeInfo);

    const selPath = overlay._lmmSelected ? this._pathFor(overlay._lmmSelected, overlay._lmmTreeInfo) : null;
    const editPath = overlay._lmmPendingEdit ? this._pathFor(overlay._lmmPendingEdit, overlay._lmmTreeInfo) : null;

    overlay._lmmLastContent = newContent;
    overlay._lmmParsed = this._parseStructured(newContent);
    overlay._lmmTreeInfo = this._buildTree(overlay._lmmParsed, file.basename);
    overlay._lmmSelected = selPath ? this._nodeAtPath(overlay._lmmTreeInfo, selPath) : null;
    overlay._lmmPendingEdit = editPath ? this._nodeAtPath(overlay._lmmTreeInfo, editPath) : null;

    this._renderTreeIntoCanvas(overlay, true);

    // Restore focus synchronously so keyboard shortcuts work immediately
    if (overlay._lmmSelected && overlay._lmmSelected._el) {
      overlay._lmmSelected._el.focus({ preventScroll: true });
    }

    try {
      overlay._lmmWriting = true;
      await this.app.vault.modify(file, newContent);
      requestAnimationFrame(() => { overlay._lmmWriting = false; });
    } catch (e) {
      overlay._lmmWriting = false;
      console.error('[LightMindMap] persist error', e);
      new obsidian.Notice('Failed to save mindmap: ' + e.message);
    }
  }

  _pathFor(node, treeInfo) {
    if (!node || !treeInfo) return null;
    const path = [];
    let cur = node;
    while (cur && cur.parent) {
      const idx = cur.parent.children.indexOf(cur);
      if (idx < 0) return null;
      path.unshift(idx);
      cur = cur.parent;
    }
    if (cur !== treeInfo.tree) return null;
    return path;
  }

  _nodeAtPath(treeInfo, path) {
    let cur = treeInfo.tree;
    for (const i of path) {
      if (!cur || !cur.children[i]) return null;
      cur = cur.children[i];
    }
    return cur;
  }

  // ────────────────────────────────────────────────────────────────
  // Layout & geometry.
  // ────────────────────────────────────────────────────────────────

  _measureNodes(node) {
    const r = node._el.getBoundingClientRect();
    node.width = Math.max(r.width, 40);
    node.height = Math.max(r.height, 24);
    if (node.collapsed) return;
    for (const c of node.children) this._measureNodes(c);
  }

  _computeSubtreeHeight(node) {
    if (node.collapsed || node.children.length === 0) {
      node._sth = node.height;
      return node._sth;
    }
    let total = 0;
    for (const c of node.children) total += this._computeSubtreeHeight(c);
    total += (node.children.length - 1) * VGAP;
    node._sth = Math.max(node.height, total);
    return node._sth;
  }

  _layoutTree(root, layout, overlay) {
    if (layout === 'right') {
      this._computeSubtreeHeight(root);
      this._placeRight(root, 0, 0);
    } else if (layout === 'left') {
      this._computeSubtreeHeight(root);
      this._placeLeft(root, 0, 0);
    } else {
      this._layoutBalanced(root, overlay);
    }
  }

  _placeRight(node, x, yCenter) {
    node.x = x;
    node.y = yCenter - node.height / 2;
    if (node.collapsed || node.children.length === 0) return;
    const gap = node.depth === 0 ? ROOT_HGAP : HGAP;
    const childX = x + node.width + gap;
    let totalH = 0;
    for (const c of node.children) totalH += c._sth;
    totalH += (node.children.length - 1) * VGAP;
    let cy = yCenter - totalH / 2;
    for (const c of node.children) {
      const childYCenter = cy + c._sth / 2;
      this._placeRight(c, childX, childYCenter);
      cy += c._sth + VGAP;
    }
  }

  _placeLeft(node, xRight, yCenter) {
    node.x = xRight - node.width;
    node.y = yCenter - node.height / 2;
    if (node.collapsed || node.children.length === 0) return;
    const gap = node.depth === 0 ? ROOT_HGAP : HGAP;
    const childRight = node.x - gap;
    let totalH = 0;
    for (const c of node.children) totalH += c._sth;
    totalH += (node.children.length - 1) * VGAP;
    let cy = yCenter - totalH / 2;
    for (const c of node.children) {
      const childYCenter = cy + c._sth / 2;
      this._placeLeft(c, childRight, childYCenter);
      cy += c._sth + VGAP;
    }
  }

  _layoutBalanced(root, overlay) {
    const children = root.children;
    if (children.length === 0) {
      root.x = -root.width / 2;
      root.y = -root.height / 2;
      return;
    }
    for (const c of children) this._computeSubtreeHeight(c);

    let right, left;
    const cached = overlay && overlay._lmmSideCache;
    if (cached && cached.length === children.length &&
        cached.every((s, i) => s.text === children[i].text)) {
      right = [];
      left = [];
      for (let i = 0; i < children.length; i++) {
        if (cached[i].side === 'left') left.push(children[i]);
        else right.push(children[i]);
      }
    } else {
      const ranked = children.map((c, i) => ({ c, i })).sort((a, b) => b.c._sth - a.c._sth);
      right = [];
      left = [];
      let rH = 0;
      let lH = 0;
      for (const { c } of ranked) {
        if (rH <= lH) { right.push(c); rH += c._sth + VGAP; }
        else { left.push(c); lH += c._sth + VGAP; }
      }
      right.sort((a, b) => children.indexOf(a) - children.indexOf(b));
      left.sort((a, b) => children.indexOf(a) - children.indexOf(b));
    }

    if (overlay) {
      overlay._lmmSideCache = children.map(c => ({
        text: c.text,
        side: right.includes(c) ? 'right' : 'left'
      }));
    }

    root.x = -root.width / 2;
    root.y = -root.height / 2;
    root._side = 'root';

    const rightX = root.x + root.width + ROOT_HGAP;
    let totalRH = right.reduce((s, c) => s + c._sth, 0) + Math.max(0, right.length - 1) * VGAP;
    let cy = -totalRH / 2;
    for (const c of right) {
      const childYCenter = cy + c._sth / 2;
      this._placeRight(c, rightX, childYCenter);
      this._markSide(c, 'right');
      cy += c._sth + VGAP;
    }
    const leftRight = root.x - ROOT_HGAP;
    let totalLH = left.reduce((s, c) => s + c._sth, 0) + Math.max(0, left.length - 1) * VGAP;
    cy = -totalLH / 2;
    for (const c of left) {
      const childYCenter = cy + c._sth / 2;
      this._placeLeft(c, leftRight, childYCenter);
      this._markSide(c, 'left');
      cy += c._sth + VGAP;
    }
  }

  _markSide(node, side) {
    node._side = side;
    for (const c of node.children) this._markSide(c, side);
  }

  _applyNodePositions(node) {
    if (node._el) {
      node._el.style.left = node.x + 'px';
      node._el.style.top = node.y + 'px';
    }
    if (node.collapsed) return;
    for (const c of node.children) this._applyNodePositions(c);
  }

  _computeBounds(node, b) {
    b = b || { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    b.minX = Math.min(b.minX, node.x);
    b.minY = Math.min(b.minY, node.y);
    b.maxX = Math.max(b.maxX, node.x + node.width);
    b.maxY = Math.max(b.maxY, node.y + node.height);
    if (node.collapsed) return b;
    for (const c of node.children) this._computeBounds(c, b);
    return b;
  }

  _shiftTree(node, dx, dy) {
    node.x += dx;
    node.y += dy;
    if (node.collapsed) return;
    for (const c of node.children) this._shiftTree(c, dx, dy);
  }

  _drawConnections(node, svg, layout, lineId) {
    if (node.collapsed) return;
    const style = LINE_STYLES[lineId] || LINE_STYLES[DEFAULT_LINE];
    for (const child of node.children) {
      let parentLeft;
      if (layout === 'balanced') parentLeft = child._side === 'right';
      else if (layout === 'left') parentLeft = false;
      else parentLeft = true;
      const startX = parentLeft ? node.x + node.width : node.x;
      const startY = node.y + node.height / 2;
      const endX = parentLeft ? child.x : child.x + child.width;
      const endY = child.y + child.height / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;
      if (style.shape === 'straight') {
        d = `M ${startX} ${startY} L ${endX} ${endY}`;
      } else if (style.shape === 'polyline') {
        const midX = startX + (endX - startX) / 2;
        d = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
      } else {
        const dx = (endX - startX) * 0.5;
        d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('stroke', child.color);
      path.setAttribute('stroke-width', String(Math.max(1.5, 4.5 - child.depth * 0.7)));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      if (style.dash) path.setAttribute('stroke-dasharray', style.dash);
      path.classList.add('lmm-conn');
      svg.appendChild(path);
      this._drawConnections(child, svg, layout, lineId);
    }
  }

  _bindCanvasClick(canvas, overlay) {
    canvas.addEventListener('click', (e) => {
      if (e.target.closest('.lmm-node')) return;
      if (overlay._lmmSelected && overlay._lmmSelected._el) {
        overlay._lmmSelected._el.classList.remove('lmm-selected');
      }
      overlay._lmmSelected = null;
    });
  }

  _bindPanZoom(canvas, inner, overlay) {
    let dragging = false;
    let sx = 0, sy = 0, stx = 0, sty = 0;
    const onDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.lmm-node, .lmm-toolbar, .lmm-btn')) return;
      // Canvas background click during edit — explicitly blur so the
      // edit commits + persists (canvas isn't focusable, so blur won't
      // fire on its own).
      if (overlay && overlay._lmmEditingNode && overlay._lmmEditingNode._el) {
        overlay._lmmEditingNode._el.blur();
        e.preventDefault();
        return;
      }
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      stx = canvas._lmm.tx; sty = canvas._lmm.ty;
      canvas.classList.add('lmm-dragging');
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      canvas._lmm.tx = stx + (e.clientX - sx);
      canvas._lmm.ty = sty + (e.clientY - sy);
      this._applyTransform(inner, canvas._lmm);
    };
    const onUp = () => { dragging = false; canvas.classList.remove('lmm-dragging'); };
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    const prevCleanup = overlay._lmmCleanup;
    overlay._lmmCleanup = () => {
      if (prevCleanup) prevCleanup();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    // ── Touch support ──
    let touchId = null;
    let pinchDist = 0;
    let pinchMid = { x: 0, y: 0 };
    let pinchScale = 1;
    let pinchTx = 0, pinchTy = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.target.closest('.lmm-node, .lmm-toolbar, .lmm-btn')) return;
      if (overlay && overlay._lmmEditingNode && overlay._lmmEditingNode._el) {
        overlay._lmmEditingNode._el.blur();
        e.preventDefault();
        return;
      }
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchId = t.identifier;
        sx = t.clientX; sy = t.clientY;
        stx = canvas._lmm.tx; sty = canvas._lmm.ty;
        canvas.classList.add('lmm-dragging');
        e.preventDefault();
      } else if (e.touches.length === 2) {
        touchId = null;
        canvas.classList.remove('lmm-dragging');
        const [a, b] = [e.touches[0], e.touches[1]];
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        pinchMid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
        pinchScale = canvas._lmm.scale;
        pinchTx = canvas._lmm.tx;
        pinchTy = canvas._lmm.ty;
        e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && touchId !== null) {
        const t = e.touches[0];
        if (t.identifier !== touchId) return;
        canvas._lmm.tx = stx + (t.clientX - sx);
        canvas._lmm.ty = sty + (t.clientY - sy);
        this._applyTransform(inner, canvas._lmm);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const newDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const factor = newDist / pinchDist;
        const newScale = Math.max(0.2, Math.min(3, pinchScale * factor));
        const rect = canvas.getBoundingClientRect();
        const ox = pinchMid.x - rect.left;
        const oy = pinchMid.y - rect.top;
        const realFactor = newScale / pinchScale;
        canvas._lmm.tx = ox - (ox - pinchTx) * realFactor;
        canvas._lmm.ty = oy - (oy - pinchTy) * realFactor;
        canvas._lmm.scale = newScale;
        this._applyTransform(inner, canvas._lmm);
        e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        touchId = null;
        canvas.classList.remove('lmm-dragging');
      } else if (e.touches.length === 1) {
        // Switched from pinch back to single-finger pan
        const t = e.touches[0];
        touchId = t.identifier;
        sx = t.clientX; sy = t.clientY;
        stx = canvas._lmm.tx; sty = canvas._lmm.ty;
      }
    });
    canvas.addEventListener('wheel', (e) => {
      const isZoom = e.ctrlKey || e.metaKey;
      if (!isZoom) {
        canvas._lmm.ty -= e.deltaY;
        canvas._lmm.tx -= e.deltaX;
        this._applyTransform(inner, canvas._lmm);
        e.preventDefault();
        return;
      }
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const rect = canvas.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const s = canvas._lmm;
      s.tx = ox - (ox - s.tx) * factor;
      s.ty = oy - (oy - s.ty) * factor;
      s.scale = Math.max(0.2, Math.min(3, s.scale * factor));
      this._applyTransform(inner, s);
      e.preventDefault();
    }, { passive: false });
  }

  _applyTransform(inner, s) {
    inner.style.transform = `translate(${s.tx}px, ${s.ty}px) scale(${s.scale})`;
  }

  _fitTo(canvas, inner) {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const iw = parseFloat(inner.style.width) || inner.clientWidth;
    const ih = parseFloat(inner.style.height) || inner.clientHeight;
    if (!iw || !ih) return;
    const scale = Math.min(cw / iw, ch / ih, 1);
    const tx = (cw - iw * scale) / 2;
    const ty = (ch - ih * scale) / 2;
    canvas._lmm = { tx, ty, scale };
    this._applyTransform(inner, canvas._lmm);
  }

  _zoomBy(canvas, inner, factor) {
    const s = canvas._lmm;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    s.tx = cx - (cx - s.tx) * factor;
    s.ty = cy - (cy - s.ty) * factor;
    s.scale = Math.max(0.2, Math.min(3, s.scale * factor));
    this._applyTransform(inner, s);
  }

  _resetTransform(canvas, inner) {
    canvas._lmm = { tx: 0, ty: 0, scale: 1 };
    this._applyTransform(inner, canvas._lmm);
  }

  // ────────────────────────────────────────────────────────────────
  // PNG Export helpers
  // ────────────────────────────────────────────────────────────────

  _hexToRgb(hex) {
    const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return [0, 0, 0];
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  _injectDoodleFilter() {
    if (document.getElementById('lmm-doodle-filter')) return;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    svg.innerHTML = `
      <defs>
        <filter id="doodle-filter" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="turbulence" seed="2"/>
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  _isDarkColor(hex) {
    const [r, g, b] = this._hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  _mixColors(hex1, hex2, weight) {
    const [r1, g1, b1] = this._hexToRgb(hex1);
    const [r2, g2, b2] = this._hexToRgb(hex2);
    const r = Math.round(r1 + (r2 - r1) * weight);
    const g = Math.round(g1 + (g2 - g1) * weight);
    const b = Math.round(b1 + (b2 - b1) * weight);
    return `rgb(${r},${g},${b})`;
  }

  _roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  _drawTextToCanvas(ctx, text, x, y, maxW, font, color, align) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';

    let displayText = text;
    let metrics = ctx.measureText(displayText);
    if (metrics.width > maxW) {
      while (displayText.length > 0 && ctx.measureText(displayText + '...').width > maxW) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }
    ctx.fillText(displayText, x, y);
    ctx.restore();
  }

  _drawNodeToCanvas(ctx, node, theme, nodeStyle, scale) {
    const x = node.x * scale;
    const y = node.y * scale;
    const w = node.width * scale;
    const h = node.height * scale;
    const r = 8 * scale;
    const depth = node.depth;
    const bgColor = theme.bg || '#FFFFFF';
    const isDark = this._isDarkColor(bgColor);

    ctx.save();

    // Draw this node
    this._drawSingleNodeToCanvas(ctx, node, x, y, w, h, r, depth, bgColor, isDark, theme, nodeStyle, scale);

    ctx.restore();

    // Recursively draw children
    if (node.collapsed) return;
    for (const child of node.children) {
      this._drawNodeToCanvas(ctx, child, theme, nodeStyle, scale);
    }
  }

  _drawDoodleRect(ctx, x, y, w, h, seed) {
    // Create a hand-drawn style irregular rectangle
    const points = [];
    const segments = 16;
    const jitter = 2.5;

    // Simple seeded random for consistent results
    let s = seed || 12345;
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s / 2147483647) * 2 - 1; // -1 to 1
    };

    // Generate points along the edges with slight jitter
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Top edge
      points.push({ x: x + t * w, y: y + rand() * jitter * 0.8 });
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      // Right edge
      points.push({ x: x + w + rand() * jitter, y: y + t * h });
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      // Bottom edge
      points.push({ x: x + w - t * w, y: y + h + rand() * jitter * 0.8 });
    }
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      // Left edge
      points.push({ x: x + rand() * jitter, y: y + h - t * h });
    }

    // Draw smooth curve through points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length; i++) {
      const p0 = points[i];
      const p1 = points[(i + 1) % points.length];
      const p2 = points[(i + 2) % points.length];

      const cpx = p1.x + (p2.x - p0.x) * 0.12;
      const cpy = p1.y + (p2.y - p0.y) * 0.12;
      ctx.quadraticCurveTo(cpx, cpy, p1.x, p1.y);
    }

    ctx.closePath();
  }

  _drawSingleNodeToCanvas(ctx, node, x, y, w, h, r, depth, bgColor, isDark, theme, nodeStyle, scale) {
    const isDoodle = nodeStyle === 'doodle';
    const isBorderless = nodeStyle === 'borderless';
    // Use a simple hash of node position for consistent doodle randomness
    const seed = Math.abs(Math.floor(node.x * 100 + node.y * 37 + node.depth * 7));
    const collapsed = node.collapsed && node.children && node.children.length > 0;
    const badgeExtra = collapsed ? 26 * scale : 0;

    // Apply rotation for doodle style
    if (isDoodle) {
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const rotation = ((seed % 5) - 2) * 0.2; // -0.4 to 0.4 degrees
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (depth === 0) {
      if (isBorderless) {
        const rootColor = theme.rootGrad ? (theme.rootGrad.match(/#[0-9a-fA-F]{6}/g) || ['#6366F1'])[0] : '#6366F1';
        this._drawTextToCanvas(ctx, node.text, x + 8 * scale, y + h / 2, w - 16 * scale - badgeExtra, `800 ${18 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, isDark ? '#E2E8F0' : rootColor);
      } else {
        // Root node: gradient background
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetY = 4 * scale;

        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        const rootGrad = theme.rootGrad || 'linear-gradient(135deg, #6366F1, #8B5CF6 60%, #EC4899)';
        const gradColors = rootGrad.match(/#[0-9a-fA-F]{6}/g) || ['#6366F1', '#EC4899'];
        grad.addColorStop(0, gradColors[0]);
        grad.addColorStop(1, gradColors[gradColors.length - 1]);

        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        this._drawTextToCanvas(ctx, node.text, x + 14 * scale, y + h / 2, w - 28 * scale - badgeExtra, `bold ${16 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, '#FFFFFF');
      }
    } else if (depth === 1) {
      if (isBorderless) {
        this._drawTextToCanvas(ctx, node.text, x + 8 * scale, y + h / 2, w - 16 * scale - badgeExtra, `700 ${14 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, isDark ? '#E2E8F0' : node.color);
      } else {
        // Level 1: solid color background
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetY = 2 * scale;

        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = node.color;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        this._drawTextToCanvas(ctx, node.text, x + 12 * scale, y + h / 2, w - 24 * scale - badgeExtra, `bold ${14 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, '#FFFFFF');
      }
    } else if (depth === 2) {
      if (isBorderless) {
        this._drawTextToCanvas(ctx, node.text, x + 10 * scale, y + h / 2, w - 20 * scale - badgeExtra, `600 ${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, isDark ? '#E2E8F0' : '#1F2937');
      } else {
        // Level 2: tinted background with colored border
        ctx.shadowColor = 'rgba(0,0,0,0.06)';
        ctx.shadowBlur = 4 * scale;

        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = this._mixColors(node.color, bgColor, 0.84);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = this._mixColors(node.color, bgColor, 0.5);
        ctx.lineWidth = 2.5 * scale;
        ctx.stroke();

        this._drawTextToCanvas(ctx, node.text, x + 10 * scale, y + h / 2, w - 20 * scale - badgeExtra, `${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, isDark ? '#E2E8F0' : '#1F2937');
      }
    } else {
      if (isBorderless) {
        this._drawTextToCanvas(ctx, node.text, x + 8 * scale, y + h / 2, w - 16 * scale - badgeExtra, `${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, isDark ? '#E2E8F0' : '#1F2937');
      } else {
        // Level 3+: subtle border
        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
        ctx.fill();

        ctx.strokeStyle = this._mixColors(node.color, bgColor, 0.6);
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        this._drawTextToCanvas(ctx, node.text, x + 8 * scale, y + h / 2, w - 16 * scale - badgeExtra, `${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`, isDark ? '#E2E8F0' : '#1F2937');
      }
    }

    // Draw collapse badge
    if (collapsed) {
      const badgeR = 9 * scale;
      const padRight = depth === 0 ? 14 : depth === 1 ? 12 : depth === 2 ? 10 : 8;
      const badgeCX = x + w - padRight * scale - badgeR;
      const badgeCY = y + h / 2;

      ctx.beginPath();
      ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = depth <= 1 ? 'rgba(255,255,255,0.85)' : node.color;
      ctx.fill();

      const crossLen = 10 * scale;
      const crossW = 2 * scale;
      ctx.fillStyle = depth === 0 ? '#6366F1' : depth === 1 ? node.color : '#FFFFFF';
      ctx.fillRect(badgeCX - crossLen / 2, badgeCY - crossW / 2, crossLen, crossW);
      ctx.fillRect(badgeCX - crossW / 2, badgeCY - crossLen / 2, crossW, crossLen);
    }

    // Restore rotation for doodle style
    if (isDoodle) {
      ctx.restore();
    }

    ctx.restore();
  }

  _drawConnectionsToCanvas(ctx, node, layout, lineStyle, scale) {
    if (node.collapsed) return;
    const style = LINE_STYLES[lineStyle] || LINE_STYLES[DEFAULT_LINE];

    for (const child of node.children) {
      let parentLeft;
      if (layout === 'balanced') parentLeft = child._side === 'right';
      else if (layout === 'left') parentLeft = false;
      else parentLeft = true;

      const startX = (parentLeft ? node.x + node.width : node.x) * scale;
      const startY = (node.y + node.height / 2) * scale;
      const endX = (parentLeft ? child.x : child.x + child.width) * scale;
      const endY = (child.y + child.height / 2) * scale;

      ctx.save();
      ctx.strokeStyle = child.color;
      ctx.lineWidth = Math.max(1.5, 4.5 - child.depth * 0.7) * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (style.dash) {
        const dashArr = style.dash.split(' ').map(Number);
        ctx.setLineDash(dashArr.map(d => d * scale));
      }

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      if (style.shape === 'straight') {
        ctx.lineTo(endX, endY);
      } else if (style.shape === 'polyline') {
        const midX = startX + (endX - startX) / 2;
        ctx.lineTo(midX, startY);
        ctx.lineTo(midX, endY);
        ctx.lineTo(endX, endY);
      } else {
        // curve
        const dx = (endX - startX) * 0.5;
        ctx.bezierCurveTo(startX + dx, startY, endX - dx, endY, endX, endY);
      }

      ctx.stroke();
      ctx.restore();

      this._drawConnectionsToCanvas(ctx, child, layout, lineStyle, scale);
    }
  }

  async _saveWithDialog(file, arrayBuffer) {
    const uint8 = new Uint8Array(arrayBuffer);
    const defaultName = (file.basename || 'mindmap') + '.mindmap.png';
    try {
      const electron = require('electron');
      const win = electron.remote.BrowserWindow.getFocusedWindow();
      const result = await electron.remote.dialog.showSaveDialog(win, {
        title: 'Export Mindmap as PNG',
        defaultPath: defaultName,
        filters: [{ name: 'PNG Image', extensions: ['png'] }]
      });
      if (result.canceled || !result.filePath) return false;
      require('fs').writeFileSync(result.filePath, Buffer.from(arrayBuffer));
      return true;
    } catch (e) {
      // Fallback: save directly into vault
      const filePath = (file.parent ? file.parent.path + '/' : '') + defaultName;
      await this.app.vault.adapter.writeBinary(filePath, uint8);
      return true;
    }
  }

  async _exportPNG(overlay) {
    try {
      const treeInfo = overlay._lmmTreeInfo;
      const tree = treeInfo && treeInfo.tree;
      if (!tree) {
        new obsidian.Notice('No mindmap to export');
        return;
      }

      const file = overlay._lmmFile;
      if (!file) {
        new obsidian.Notice('No file associated with mindmap');
        return;
      }

      const themeKey = overlay._lmmTheme || DEFAULT_THEME;
      const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME];
      const layout = overlay._lmmLayout || 'balanced';
      const lineStyle = overlay._lmmLine || DEFAULT_LINE;
      const nodeStyle = overlay._lmmNodeStyle || DEFAULT_NODE_STYLE;
      const scale = 2;

      // Calculate bounds
      const bounds = this._computeBounds(tree);
      const w = bounds.maxX - bounds.minX + PAD * 2;
      const h = bounds.maxY - bounds.minY + PAD * 2;

      // Save original positions and temporarily shift for export
      const savedPositions = [];
      const shiftDx = PAD - bounds.minX;
      const shiftDy = PAD - bounds.minY;
      const saveAndShift = (node) => {
        savedPositions.push({ node, x: node.x, y: node.y });
        node.x += shiftDx;
        node.y += shiftDy;
        if (!node.collapsed) node.children.forEach(saveAndShift);
      };
      saveAndShift(tree);

      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');

      // Get background color
      let bgColor = theme.bg;
      if (!bgColor) {
        const computedStyle = getComputedStyle(overlay);
        bgColor = computedStyle.getPropertyValue('--lmm-theme-bg').trim() ||
                  computedStyle.getPropertyValue('--background-primary').trim() ||
                  '#FFFFFF';
      }
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slate theme: draw grid pattern
      if (themeKey === 'slate') {
        const gridSize = 32 * scale;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        for (let gx = 0; gx <= canvas.width; gx += gridSize) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, canvas.height);
        }
        for (let gy = 0; gy <= canvas.height; gy += gridSize) {
          ctx.moveTo(0, gy);
          ctx.lineTo(canvas.width, gy);
        }
        ctx.stroke();
      }

      // Draw connections
      this._drawConnectionsToCanvas(ctx, tree, layout, lineStyle, scale);

      // Draw nodes
      this._drawNodeToCanvas(ctx, tree, theme, nodeStyle, scale);

      // Restore original positions
      for (const { node, x, y } of savedPositions) {
        node.x = x;
        node.y = y;
      }

      // Convert canvas to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create PNG'));
        }, 'image/png');
      });

      // Prompt user for save location
      const arrayBuffer = await blob.arrayBuffer();
      const saved = await this._saveWithDialog(file, arrayBuffer);
      if (!saved) return;
      new obsidian.Notice('Mindmap exported successfully');
    } catch (e) {
      console.error('[LightMindMap] export error:', e);
      new obsidian.Notice('Export failed: ' + e.message);
    }
  }
}

module.exports = LightMindMapPlugin;

/* nosourcemap */