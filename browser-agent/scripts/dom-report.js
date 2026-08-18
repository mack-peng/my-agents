/**
 * DOM Reality Report — Runtime DOM shape cognition + layout forensics
 *
 * Usage (two steps):
 *   1. playwright-cli eval "() => { window.__DOM_REPORT_CFG = { ROOT_SELECTOR: '.xxx', ZOOM_DIAGNOSIS: true } }"
 *   2. playwright-cli run-code --filename scripts/dom-report.js
 *
 * Config (optional, defaults below; or set via window.__DOM_REPORT_CFG):
 *   ROOT_SELECTOR   Problem root node (default: .site-version-history-dialog-wrapper)
 *   UP_TO           Ancestor chain stop tag (default: html)
 *   DOWN_DEPTH      Downward tree depth (default: 6)
 *   ZOOM_DIAGNOSIS  Test at 1x/0.5x and report diffs (default: false)
 *   MAX_NODES       Node count cap to prevent context explosion (default: 60)
 *
 * Output (unified Markdown):
 *   1. Ancestor chain with shape classification (role, sizing strategy, declared values)
 *   2. DOM tree with per-node shape info (layout role, scroll tag, height/width strategy)
 *   3. Shape analysis:
 *      - Scroll container analysis (scrollable, content-sized, collapsed)
 *      - Height anchor analysis (absolute/percent/missing declarations)
 *      - Width anchor analysis
 *      - Flex child constraint analysis (min-height:auto, flex-grow/shrink)
 *      - Containing block analysis (transform/filter/perspective)
 *      - Layout pattern recognition (fixed+no-anchor, flex-col, content-sized chain)
 */
async (page) => {
  const CFG_DEFAULTS = {
    ROOT_SELECTOR: '.site-version-history-dialog-wrapper',
    UP_TO: 'html',
    DOWN_DEPTH: 6,
    ZOOM_DIAGNOSIS: false,
    MAX_NODES: 60,
  };
  const pageCfg = await page.evaluate(() =>
    (typeof window !== 'undefined' && window.__DOM_REPORT_CFG) ? window.__DOM_REPORT_CFG : null,
  ).catch(() => null);
  const CFG = { ...CFG_DEFAULTS, ...(pageCfg || {}) };

  // 浏览器侧快照采集（全部逻辑必须在 evaluate 回调内，无法引用外部函数）
  const takeSnapshot = () => page.evaluate((c) => {
    const LAYOUT_PROPS = [
      'position', 'display', 'height', 'width', 'minHeight', 'maxHeight',
      'overflowX', 'overflowY', 'boxSizing', 'margin', 'padding',
      'flexDirection', 'flexGrow', 'flexShrink', 'flexBasis', 'alignItems', 'justifyContent',
      'transform', 'filter', 'perspective', 'willChange', 'contain',
      'zIndex', 'top', 'left', 'right', 'bottom', 'visibility', 'opacity',
    ];
    const CB_PROPS = ['transform', 'filter', 'perspective', 'willChange', 'contain'];

    // 声明值配对：扫 document.styleSheets 中命中该元素的规则，提取关键布局声明
    // 返回 { property: [ { selector, value, fileHint } ] }，最多取 3 条/属性
    const matchDeclarations = (el, wantedProps) => {
      const out = {};
      let scanned = 0;
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.selectorText && el.matches && el.matches(rule.selectorText)) {
            const decls = rule.style;
            for (const p of wantedProps) {
              const v = decls.getPropertyValue(p);
              if (v) {
                (out[p] = out[p] || []).push({ selector: rule.selectorText, value: v.trim(), href: (sheet.href || '').split('/').slice(-2).join('/') });
              }
            }
          }
          scanned += 1;
          if (scanned > 8000) return out;
        }
      }
      // inline style 声明最高优先级，合并进来（来源标记为 inline）
      for (const p of wantedProps) {
        const iv = el.style.getPropertyValue(p);
        if (iv && !(out[p] || []).some(d => d.selector === 'inline')) {
          (out[p] = out[p] || []).push({ selector: 'inline', value: iv.trim(), href: '' });
        }
      }
      return out;
    };

    // Shape classification: layout role + sizing strategy
    const classifyShape = (cs, declared) => {
      const display = cs.display;
      const position = cs.position;
      const flexDir = cs.flexDirection;
      const overflowY = cs.overflowY;
      const overflowX = cs.overflowX;

      // Layout role
      let role = 'block';
      if (position === 'fixed') role = 'fixed';
      else if (position === 'absolute') role = 'absolute';
      else if (position === 'sticky') role = 'sticky';
      else if (display === 'grid' || display === 'inline-grid') role = 'grid';
      else if (display === 'flex' || display === 'inline-flex') {
        role = flexDir === 'column' ? 'flex-col' : 'flex-row';
      }
      else if (display === 'inline' || display === 'inline-block') role = 'inline';

      // Scroll container detection
      const isScrollY = overflowY === 'auto' || overflowY === 'scroll';
      const isScrollX = overflowX === 'auto' || overflowX === 'scroll';
      const scrollTag = isScrollY ? (isScrollX ? 'scroll-xy' : 'scroll-y') : (isScrollX ? 'scroll-x' : '');

      // Sizing strategy: use DECLARED values (not computed, which is always px)
      const getDeclared = (prop) => {
        const arr = declared && declared[prop];
        if (!arr || arr.length === 0) return null;
        const inline = arr.find(d => d.selector === 'inline');
        return inline ? inline.value : arr[0].value;
      };

      const sizeClass = (prop, maxProp) => {
        const val = getDeclared(prop);
        const maxVal = getDeclared(maxProp);
        if (val) {
          if (/^(0|[1-9]\d*)(\.\d+)?(px|pt|cm|mm|in)$/.test(val)) return 'fixed';
          if (/^(0|[1-9]\d*)(\.\d+)?(vh|vw|vmin|vmax)$/.test(val)) return 'viewport';
          if (val.endsWith('%')) return 'percent';
          if (/^calc\(/.test(val)) return 'calc';
          if (val === 'min-content' || val === 'max-content' || val === 'fit-content') return 'content';
        }
        if (maxVal && maxVal !== 'none' && maxVal !== 'auto') return 'constrained';
        return 'content';
      };

      const heightStrategy = sizeClass('height', 'max-height');
      const widthStrategy = sizeClass('width', 'max-width');

      // Flex child: check declared flex properties (not computed defaults)
      const hasFlexDecl = !!(getDeclared('flex-grow') || getDeclared('flex-shrink') || getDeclared('flex-basis') || getDeclared('flex'));
      const isFlexChild = hasFlexDecl;

      return { role, scrollTag, heightStrategy, widthStrategy, isFlexChild };
    };

    const collectNode = (el, maxText) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const props = {};
      for (const p of LAYOUT_PROPS) props[p] = cs[p];
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, maxText);
      const declared = matchDeclarations(el, [
        'height', 'max-height', 'min-height', 'width', 'max-width', 'min-width',
        'overflow', 'overflow-x', 'overflow-y',
        'position', 'display', 'box-sizing',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction',
        'align-items', 'justify-content', 'align-self',
        'grid-template-columns', 'grid-template-rows',
        'top', 'left', 'right', 'bottom',
        'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
        'padding', 'padding-top', 'padding-bottom',
        'transform', 'filter', 'perspective', 'will-change', 'contain',
        'z-index', 'visibility', 'opacity',
      ]);
      const shape = classifyShape(cs, declared);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: (typeof el.className === 'string' && el.className) ? el.className.split(/\s+/).filter(Boolean) : [],
        inlineStyle: el.getAttribute('style') || null,
        text,
        props,
        declared,
        shape,
        metrics: {
          rect: { x: +rect.x.toFixed(1), y: +rect.y.toFixed(1), width: +rect.width.toFixed(1), height: +rect.height.toFixed(1) },
          rectBottom: +rect.bottom.toFixed(1),
          rectRight: +rect.right.toFixed(1),
          offsetHeight: el.offsetHeight,
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
        },
        flags: {
          overflowsViewport: rect.bottom > innerHeight + 1 || rect.right > innerWidth + 1,
          overflowsParent: rect.bottom > (el.parentElement ? el.parentElement.getBoundingClientRect().bottom + 1 : innerHeight),
          hasScrollY: el.scrollHeight > el.clientHeight + 1,
          hasScrollX: el.scrollWidth > el.clientWidth + 1,
          scrollable: (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0,
        },
        containingBlockModifiers: CB_PROPS.filter(p => {
          const v = cs[p];
          return v && v !== 'none' && v !== 'auto' && v !== 'normal' && v !== 'visible' && v !== 'false';
        }).map(p => `${p}: ${cs[p]}`),
      };
    };

    const isSameShape = (a, b) =>
      a && b && a.tagName === b.tagName && a.id === b.id &&
      a.className === b.className;

    const buildTree = (el, depth, state) => {
      if (!el || state.count >= c.MAX_NODES || depth < 0) return null;
      state.count += 1;
      const node = { ...collectNode(el, 40), children: [] };
      const kids = Array.from(el.children);
      if (depth > 0) {
        let i = 0;
        while (i < kids.length) {
          const run = [kids[i]];
          let j = i + 1;
          while (j < kids.length && isSameShape(kids[i], kids[j])) { run.push(kids[j]); j += 1; }
          const rep = buildTree(run[0], depth - 1, state);
          if (rep) {
            const copy = { ...rep, repeat: run.length };
            node.children.push(copy);
          }
          i = j;
        }
      }
      return node;
    };

    const walkUp = (el, stopTag) => {
      const chain = [];
      let cur = el;
      while (cur && cur.tagName.toLowerCase() !== stopTag) {
        chain.unshift(cur);
        cur = cur.parentElement;
      }
      if (cur) chain.unshift(cur);
      return chain;
    };

    const analyzeShape = (rootNode, ancestors) => {
      const findings = [];

      // === Shape summary: classify the ancestor chain ===
      const chainShapes = ancestors.map(a => ({
        label: a.label,
        role: a.shape.role,
        scrollTag: a.shape.scrollTag,
        hStrategy: a.shape.heightStrategy,
        wStrategy: a.shape.widthStrategy,
        isFlexChild: a.shape.isFlexChild,
        computed: { w: a.metrics.clientWidth, h: a.metrics.offsetHeight },
      }));
      findings.push(`## Shape chain (root→up)`);
      for (const s of chainShapes) {
        const flex = s.isFlexChild ? ' flex-child' : '';
        const scroll = s.scrollTag ? ` ${s.scrollTag}` : '';
        findings.push(`  ${s.label}: ${s.role}${scroll} | h:${s.hStrategy} w:${s.wStrategy} | ${s.computed.w}×${s.computed.h}${flex}`);
      }

      // === Scroll container analysis ===
      const scrollNodes = [];
      const collectScroll = (n) => {
        if (!n) return;
        if (n.flags.hasScrollY || n.props.overflowY === 'auto' || n.props.overflowY === 'scroll') scrollNodes.push(n);
        for (const child of n.children) collectScroll(child);
      };
      collectScroll(rootNode);

      const constraintNodes = [];
      const collectOverflow = (n, parent) => {
        if (!n) return;
        const parentHealthy = parent && parent.metrics.clientHeight > 0;
        if (n.flags.overflowsParent && !(n.props.overflowY === 'auto' || n.props.overflowY === 'scroll') && parentHealthy) {
          constraintNodes.push(n);
        }
        for (const child of n.children) collectOverflow(child, n);
      };
      collectOverflow(rootNode, null);
      if (rootNode.flags.overflowsParent && !(rootNode.props.overflowY === 'auto' || rootNode.props.overflowY === 'scroll')) {
        const pEl = root.parentElement;
        if (pEl && pEl.clientHeight > 0) constraintNodes.push(rootNode);
      }

      findings.push(`## Scroll analysis`);
      for (const n of constraintNodes.slice(0, 8)) {
        const label = `${n.tag}.${(n.classes || []).join('.')}`;
        findings.push(`⚠ ${label} overflows parent but is not a scroll container → constraint candidate (flex child min-height:auto or parent height unconstrained)`);
      }
      for (const n of scrollNodes) {
        const label = `${n.tag}.${(n.classes || []).join('.')}`;
        const isScrollDeclared = n.props.overflowY === 'auto' || n.props.overflowY === 'scroll';
        if (n.flags.scrollable) {
          findings.push(`✔ ${label} scrollable (scrollHeight ${n.metrics.scrollHeight} > clientHeight ${n.metrics.clientHeight})`);
        } else if (!n.flags.hasScrollY && n.metrics.clientHeight === 0) {
          findings.push(`⚠ ${label} height collapsed to 0 → overflow-y:auto has no viewport → height chain unconstrained (anchor issue)`);
        } else if (!n.flags.hasScrollY && isScrollDeclared && Math.abs(n.metrics.offsetHeight - n.metrics.scrollHeight) <= 1) {
          findings.push(`⚠ ${label} content-sized (${n.metrics.offsetHeight}px, scrollHeight==clientHeight) → overflow-y:auto never triggers → height chain unconstrained (anchor issue)`);
        } else if (!n.flags.hasScrollY) {
          findings.push(`✔ ${label} no overflow, no scroll needed`);
        } else if (n.metrics.clientHeight === 0) {
          findings.push(`⚠ ${label} content overflows (${n.metrics.scrollHeight}>0) but viewport is 0 (clientHeight=0) → overflow=${n.props.overflowY} has no space → height chain unconstrained (anchor issue)`);
        } else {
          findings.push(`⚠ ${label} content overflows (${n.metrics.scrollHeight}>${n.metrics.clientHeight}) clipped by overflow=${n.props.overflowY} → height chain unconstrained (anchor issue)`);
        }
      }

      // === Height anchor analysis ===
      findings.push(`## Height anchor`);
      const anchorInfo = ancestors.map(a => {
        const dh = (a.declared && a.declared.height) || [];
        const first = dh.find(d => d.selector === 'inline') || dh[0] || null;
        const mh = (a.declared && a.declared['max-height']) || [];
        const maxFirst = mh.find(d => d.selector === 'inline') || mh[0] || null;
        return {
          label: a.label,
          declared: first ? `${first.value} (${first.selector} ${first.href})` : '(no height declaration)',
          maxDeclared: maxFirst ? `${maxFirst.value} (${maxFirst.selector} ${maxFirst.href})` : null,
          computed: a.props.height,
          hasAbsolute: !!(first && /^(0|[1-9]\d*)(\.\d+)?(px|vh|vw|rem|em)$/.test(first.value)),
          hasPercent: !!(first && first.value.endsWith('%')),
        };
      });
      const anchored = anchorInfo.find(a => a.hasAbsolute);
      findings.push(`Anchor check: ${anchored ? `chain has absolute-unit height at ${anchored.label}: ${anchored.declared}` : 'all heights are % or missing → chain depends on containing block runtime resolution (may resolve to auto)'}`);
      for (const a of anchorInfo) {
        const maxPart = a.maxDeclared ? ` | max-height:${a.maxDeclared}` : '';
        findings.push(`  - ${a.label}: declared ${a.declared}${maxPart} → computed ${a.computed}`);
      }
      const maxOnly = anchorInfo.filter(a => !a.declared.includes('px') && !a.declared.includes('vh') && a.maxDeclared);
      if (maxOnly.length) {
        findings.push(`⚠ These nodes only have max-height (cap, not anchor) → % children still resolve to auto: ${maxOnly.map(a => a.label).join(', ')}`);
      }
      if (rootNode.props.position === 'fixed' && /%/.test(rootNode.props.height)) {
        findings.push(`⚠ Root is position:fixed + percent height (computed ${rootNode.metrics.offsetHeight}px) → anchor depends on containing block, unprovable statically`);
      }

      // === Width analysis ===
      findings.push(`## Width analysis`);
      const widthInfo = ancestors.map(a => {
        const dw = (a.declared && a.declared.width) || [];
        const first = dw.find(d => d.selector === 'inline') || dw[0] || null;
        const mw = (a.declared && a.declared['max-width']) || [];
        const maxFirst = mw.find(d => d.selector === 'inline') || mw[0] || null;
        return {
          label: a.label,
          declared: first ? `${first.value} (${first.selector})` : '(no width declaration)',
          maxDeclared: maxFirst ? `${maxFirst.value} (${maxFirst.selector})` : null,
          computed: a.metrics.clientWidth,
          hasAbsolute: !!(first && /^(0|[1-9]\d*)(\.\d+)?(px|vh|vw|rem|em)$/.test(first.value)),
        };
      });
      const widthAnchored = widthInfo.find(a => a.hasAbsolute);
      findings.push(`Width anchor: ${widthAnchored ? `chain has absolute-unit width at ${widthAnchored.label}: ${widthAnchored.declared}` : 'no absolute width in chain → width depends on parent/content'}`);
      for (const a of widthInfo) {
        if (a.declared !== '(no width declaration)' || a.maxDeclared) {
          const maxPart = a.maxDeclared ? ` | max-width:${a.maxDeclared}` : '';
          findings.push(`  - ${a.label}: declared ${a.declared}${maxPart} → computed ${a.computed}px`);
        }
      }

      // === Flex child constraint analysis ===
      findings.push(`## Flex constraints`);
      const flexParents = [];
      const collectFlexParents = (n, parent) => {
        if (!n) return;
        if (parent && (parent.props.display === 'flex' || parent.props.display === 'inline-flex')) {
          flexParents.push({ parent, child: n });
        }
        for (const child of n.children) collectFlexParents(child, n);
      };
      collectFlexParents(rootNode, null);
      for (const { parent, child } of flexParents.slice(0, 10)) {
        const pLabel = `${parent.tag}.${(parent.classes || []).join('.')}`;
        const cLabel = `${child.tag}.${(child.classes || []).join('.')}`;
        const pDir = parent.props.flexDirection || 'row';
        const cMinH = child.props.minHeight;
        const cMinW = child.props.minWidth;
        const cFlexGrow = child.props.flexGrow;
        const cFlexShrink = child.props.flexShrink;
        const cOverflow = child.props.overflowY;

        if (pDir === 'column') {
          // Flex column: children height constrained by flex properties
          if (cMinH === 'auto' || cMinH === '0px') {
            if (child.metrics.scrollHeight > child.metrics.clientHeight + 1) {
              findings.push(`⚠ ${cLabel} is flex-col child with min-height:${cMinH} → content (${child.metrics.scrollHeight}px) may overflow parent (${parent.metrics.clientHeight}px)`);
            }
          }
          if (cFlexGrow === '0' && cFlexShrink === '0' && cMinH === 'auto') {
            findings.push(`  ${cLabel}: flex:0 0 auto in ${pLabel}(column) → height is content-driven, not constrained by flex`);
          }
        } else {
          // Flex row: children width constrained by flex, height unconstrained
          if (cMinW === 'auto' || cMinW === '0px') {
            if (child.metrics.scrollWidth > child.metrics.clientWidth + 1) {
              findings.push(`⚠ ${cLabel} is flex-row child with min-width:${cMinW} → content (${child.metrics.scrollWidth}px) may overflow parent`);
            }
          }
        }
      }
      if (flexParents.length === 0) {
        findings.push(`  No flex parent-child relationships found in the tree`);
      }

      // === Containing block analysis ===
      findings.push(`## Containing block`);
      const cbNodes = [];
      const collectCB = (n) => {
        if (!n) return;
        if (n.containingBlockModifiers && n.containingBlockModifiers.length > 0) {
          cbNodes.push(n);
        }
        for (const child of n.children) collectCB(child);
      };
      collectCB(rootNode);
      for (const n of cbNodes.slice(0, 5)) {
        const label = `${n.tag}.${(n.classes || []).join('.')}`;
        findings.push(`  ${label}: CB modifiers: ${n.containingBlockModifiers.join(', ')}`);
      }
      if (cbNodes.length === 0) {
        findings.push(`  No containing block modifiers found in the tree`);
      }

      // === Pattern recognition ===
      findings.push(`## Layout patterns`);
      const hasFixedAncestor = ancestors.some(a => a.shape.role === 'fixed');
      const hasFlexColAncestor = ancestors.some(a => a.shape.role === 'flex-col');
      const scrollContainer = scrollNodes.find(n => n.flags.scrollable);
      const noHeightAnchor = !anchored;
      const allContentSized = ancestors.every(a => a.shape.heightStrategy === 'content');

      if (hasFixedAncestor && noHeightAnchor) {
        findings.push(`Pattern: fixed ancestor + no height anchor → children % resolve to auto → content-sized overflow`);
      }
      if (hasFlexColAncestor) {
        const flexCol = ancestors.find(a => a.shape.role === 'flex-col');
        findings.push(`Pattern: flex-col at ${flexCol.label} → children height governed by flex-grow/shrink/min-height`);
      }
      if (scrollContainer && noHeightAnchor) {
        findings.push(`Pattern: scroll container exists but no height anchor above → overflow:auto never triggers (content-sized)`);
      }
      if (allContentSized) {
        findings.push(`Pattern: all ancestors are content-sized → height entirely depends on content, no constraints propagate`);
      }

      return findings;
    };

    const root = document.querySelector(c.ROOT_SELECTOR);
    if (!root) {
      const candidates = Array.from(document.querySelectorAll('.s-kit-modal, [class*="dialog"]'))
        .slice(0, 5)
        .map(el => `${el.tagName}.${(typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(Boolean).join('.')}`);
      return { error: `未找到 ${c.ROOT_SELECTOR}`, candidates, rootSelector: c.ROOT_SELECTOR, upTo: c.UP_TO, downDepth: c.DOWN_DEPTH, nodeCount: 0, ancestors: [], tree: null, findings: ['无法分析'] };
    }
    const ancestors = walkUp(root, c.UP_TO).map(el => {
      const n = collectNode(el, 30);
      return {
        label: `${n.tag}.${(n.classes || []).join('.')}`,
        props: n.props,
        metrics: n.metrics,
        flags: n.flags,
        declared: n.declared,
        shape: n.shape,
        containingBlockModifiers: n.containingBlockModifiers,
        inlineStyle: n.inlineStyle,
      };
    });
    const state = { count: 0 };
    const tree = buildTree(root, c.DOWN_DEPTH, state);
    const findings = analyzeShape(tree, ancestors);
    return {
      rootSelector: c.ROOT_SELECTOR,
      upTo: c.UP_TO,
      downDepth: c.DOWN_DEPTH,
      nodeCount: state.count,
      ancestors,
      tree,
      findings,
    };
  }, CFG);

  // 以下为 Node 侧纯渲染（只处理快照数据）
  const renderNode = (node, indent) => {
    const lines = [];
    if (!node) return lines;
    const cls = node.classes.length ? `.${node.classes.join('.')}` : '';
    const id = node.id ? `#${node.id}` : '';
    const repeat = node.repeat ? ` ×${node.repeat}` : '';
    const m = node.metrics;
    const s = node.shape || {};
    const flag = [];
    if (node.flags.overflowsViewport) flag.push('⚠viewport-overflow');
    if (node.flags.overflowsParent) flag.push('⚠parent-overflow');
    if (m.clientHeight === 0 && m.offsetHeight === 0) flag.push('⚠collapsed(0px)');
    if (node.flags.scrollable) flag.push('✔scrollable');
    if (node.flags.hasScrollY && !node.flags.scrollable) flag.push(`⚠overflow(${m.scrollHeight}>${m.clientHeight})but-overflow=${node.props.overflowY}`);
    if (node.containingBlockModifiers.length) flag.push(`CB:${node.containingBlockModifiers.join(' ')}`);
    const styleHint = node.inlineStyle ? ` style="${node.inlineStyle}"` : '';
    const h = node.props.height;
    const heightStr = h === 'auto' ? `auto→${m.offsetHeight}px` : `${h}`;
    const w = node.props.width;
    const widthStr = w === 'auto' ? `auto→${m.clientWidth}px` : `${w}`;
    const mhStr = node.declared && node.declared['max-height'] ? ` maxH:${node.declared['max-height'].map(x => x.value).join(';')}` : '';
    const shapeStr = s.role ? `[${s.role}${s.scrollTag ? ' ' + s.scrollTag : ''} h:${s.heightStrategy} w:${s.widthStrategy}]` : '';
    lines.push(
      `${'  '.repeat(indent)}<${node.tag}${id}${cls}${styleHint}${repeat}>` +
      ` ${shapeStr}` +
      ` [${node.props.position},${node.props.display},h:${heightStr},w:${widthStr}${mhStr}]` +
      ` rect(${m.rect.width}×${m.rect.height}) bottom=${m.rectBottom} scroll=${m.clientHeight}/${m.scrollHeight}` +
      (flag.length ? ` ${flag.join(' ')}` : '') +
      (node.text ? ` 「${node.text.slice(0, 30)}」` : ''),
    );
    for (const child of node.children) lines.push(...renderNode(child, indent + 1));
    return lines;
  };

  const renderAncestors = (chain) => chain.map(a => {
    const dh = (a.declared && a.declared.height) ? a.declared.height.map(x => `${x.selector}→${x.value}`).join('; ') : 'auto';
    const dw = (a.declared && a.declared.width) ? a.declared.width.map(x => `${x.selector}→${x.value}`).join('; ') : 'auto';
    const mh = (a.declared && a.declared['max-height']) ? a.declared['max-height'].map(x => `${x.selector}→${x.value}`).join('; ') : null;
    const maxPart = mh ? ` max-height:${mh}` : '';
    const s = a.shape || {};
    const shapeStr = s.role ? `[${s.role}${s.scrollTag ? ' ' + s.scrollTag : ''} h:${s.heightStrategy} w:${s.widthStrategy}]` : '';
    return `${a.label} ${shapeStr} [${a.props.position},${a.props.display}] h:${dh}${maxPart} w:${dw} → ${a.metrics.clientWidth}×${a.metrics.offsetHeight}` +
      (a.containingBlockModifiers.length ? ` CB:${a.containingBlockModifiers.join(' ')}` : '') +
      (a.inlineStyle ? ` style="${a.inlineStyle}"` : '');
  });

  const renderReport = (snapshot, vp) => {
    const lines = [];
    lines.push(`# DOM Reality Report`);
    lines.push(`viewport: ${vp.width}×${vp.height} | root: ${snapshot.rootSelector} | nodes: ${snapshot.nodeCount}`);
    if (snapshot.error) {
      lines.push(`⚠ ${snapshot.error}`);
      if (snapshot.candidates && snapshot.candidates.length) {
        lines.push(`Similar nodes: ${snapshot.candidates.join(', ')}`);
      }
      return lines.join('\n');
    }
    lines.push('');
    lines.push(`## Ancestor chain (root→${snapshot.upTo})`);
    lines.push('```');
    lines.push(...renderAncestors(snapshot.ancestors));
    lines.push('```');
    lines.push('');
    lines.push(`## DOM tree (${snapshot.downDepth} levels deep)`);
    lines.push('```');
    lines.push(...renderNode(snapshot.tree, 0));
    lines.push('```');
    lines.push('');
    for (const f of snapshot.findings) {
      if (f.startsWith('##')) {
        lines.push('');
        lines.push(f);
      } else if (f.startsWith('  ') || f.startsWith('Pattern:')) {
        lines.push(f);
      } else {
        lines.push(`- ${f}`);
      }
    }
    return lines.join('\n');
  };

  const base = await takeSnapshot();
  let zoomSection = null;
  if (CFG.ZOOM_DIAGNOSIS && !base.error) {
    const vp = page.viewportSize();
    await page.setViewportSize({ width: Math.max(320, Math.round(vp.width / 2)), height: Math.max(320, Math.round(vp.height / 2)) });
    await page.waitForTimeout(300);
    const half = await takeSnapshot();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);
    const diffs = [];
    if (base.tree && half.tree) {
      const walk = (n1, n2, path) => {
        if (!n1 || !n2) return;
        for (const k of ['rectBottom', 'clientHeight', 'scrollHeight']) {
          if (n1.metrics[k] !== n2.metrics[k]) diffs.push({ path, key: k, a: n1.metrics[k], b: n2.metrics[k] });
        }
        const n1c = n1.children || [];
        const n2c = n2.children || [];
        for (let i = 0; i < Math.max(n1c.length, n2c.length); i++) {
          const c2 = n2c[i] || n1c[i];
          if (!c2) continue;
          walk(n1c[i], n2c[i], `${path} > ${c2.tag}.${(c2.classes || []).join('.')}`);
        }
      };
      walk(base.tree, half.tree, CFG.ROOT_SELECTOR);
    }
    zoomSection = {
      viewportHalf: { width: Math.round(vp.width / 2), height: Math.round(vp.height / 2) },
      diffs: diffs.slice(0, 20),
      halfNodeCount: half.nodeCount,
    };
  }

  const lines = [renderReport(base, page.viewportSize())];
  if (zoomSection) {
    lines.push('');
    lines.push(`## Zoom 诊断（1x → 0.5x, viewport ${zoomSection.viewportHalf.width}×${zoomSection.viewportHalf.height}）`);
    if (zoomSection.diffs.length === 0) {
      lines.push('- 无差异：布局与视口无关（锚定良好或内容自适应）');
    } else {
      for (const d of zoomSection.diffs) {
        lines.push(`- ${d.path}: ${d.key} ${d.a} → ${d.b}`);
      }
    }
    lines.push('');
    lines.push('- 解释: 若 0.5x 时 rectBottom 不再溢出视口且 overflow 生效 → 内容尺寸(auto)盒子溢出视口的签名 → 锚点问题');
  }
  const out = lines.join('\n');
  console.log(out);
  return out;
}