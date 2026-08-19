async (page) => {
// src/browser/browserScript.ts
function createSnapshotScript(configStr) {
  return `(() => {
    const c = ${configStr};

    const LAYOUT_PROPS = [
      'position','display','height','width','minHeight','maxHeight',
      'overflowX','overflowY','boxSizing','margin','padding',
      'flexDirection','flexGrow','flexShrink','flexBasis','alignItems','justifyContent',
      'transform','filter','perspective','willChange','contain',
      'zIndex','top','left','right','bottom','visibility','opacity',
    ];
    const CB_PROPS = ['transform','filter','perspective','willChange','contain'];
    const WANTED_PROPS = [
      'height','max-height','min-height','width','max-width','min-width',
      'overflow','overflow-x','overflow-y',
      'position','display','box-sizing',
      'flex','flex-grow','flex-shrink','flex-basis','flex-direction',
      'align-items','justify-content','align-self',
      'grid-template-columns','grid-template-rows',
      'top','left','right','bottom',
      'margin','margin-top','margin-bottom','margin-left','margin-right',
      'padding','padding-top','padding-bottom',
      'transform','filter','perspective','will-change','contain',
      'z-index','visibility','opacity',
    ];

    var crossOriginBlocked = 0;
    var blockedSheetUrls = [];

    function matchDeclarations(el, wantedProps) {
      var out = {};
      var scanned = 0;
      var sheets = Array.from(document.styleSheets);
      for (var si = 0; si < sheets.length; si++) {
        var rules;
        try { rules = sheets[si].cssRules; } catch(e) { crossOriginBlocked++; blockedSheetUrls.push((sheets[si].href || 'unknown').split('/').pop()); continue; }
        if (!rules) continue;
        for (var ri = 0; ri < rules.length; ri++) {
          var rule = rules[ri];
          if (rule.selectorText && el.matches && el.matches(rule.selectorText)) {
            var decls = rule.style;
            for (var pi = 0; pi < wantedProps.length; pi++) {
              var p = wantedProps[pi];
              var v = decls.getPropertyValue(p);
              if (v) {
                (out[p] = out[p] || []).push({ selector: rule.selectorText, value: v.trim(), href: (sheets[si].href || '').split('/').slice(-2).join('/') });
              }
            }
          }
          scanned++;
          if (scanned > 8000) return out;
        }
      }
      for (var pi2 = 0; pi2 < wantedProps.length; pi2++) {
        var p2 = wantedProps[pi2];
        var iv = el.style.getPropertyValue(p2);
        if (iv && !(out[p2] || []).some(function(d) { return d.selector === 'inline'; })) {
          (out[p2] = out[p2] || []).push({ selector: 'inline', value: iv.trim(), href: '' });
        }
      }
      return out;
    }

    function classifyShape(cs, declared) {
      var display = cs.display;
      var position = cs.position;
      var flexDir = cs.flexDirection;
      var overflowY = cs.overflowY;
      var overflowX = cs.overflowX;
      var role = 'block';
      if (position === 'fixed') role = 'fixed';
      else if (position === 'absolute') role = 'absolute';
      else if (position === 'sticky') role = 'sticky';
      else if (display === 'grid' || display === 'inline-grid') role = 'grid';
      else if (display === 'flex' || display === 'inline-flex') { role = flexDir === 'column' ? 'flex-col' : 'flex-row'; }
      else if (display === 'inline' || display === 'inline-block') role = 'inline';
      var isScrollY = overflowY === 'auto' || overflowY === 'scroll';
      var isScrollX = overflowX === 'auto' || overflowX === 'scroll';
      var scrollTag = isScrollY ? (isScrollX ? 'scroll-xy' : 'scroll-y') : (isScrollX ? 'scroll-x' : '');
      function getDeclared(prop) {
        var arr = declared && declared[prop];
        if (!arr || arr.length === 0) return null;
        var inline = arr.find(function(d) { return d.selector === 'inline'; });
        return inline ? inline.value : arr[0].value;
      }
      function sizeClass(prop, maxProp) {
        var val = getDeclared(prop);
        var maxVal = getDeclared(maxProp);
        if (val) {
          if (/^(0|[1-9]\\d*)(\\.\\d+)?(px|pt|cm|mm|in)$/.test(val)) return 'fixed';
          if (/^(0|[1-9]\\d*)(\\.\\d+)?(vh|vw|vmin|vmax)$/.test(val)) return 'viewport';
          if (val.endsWith('%')) return 'percent';
          if (/^calc\\(/.test(val)) return 'calc';
          if (val === 'min-content' || val === 'max-content' || val === 'fit-content') return 'content';
        }
        if (maxVal && maxVal !== 'none' && maxVal !== 'auto') return 'constrained';
        return 'content';
      }
      var heightStrategy = sizeClass('height', 'max-height');
      var widthStrategy = sizeClass('width', 'max-width');
      var hasFlexDecl = !!(getDeclared('flex-grow') || getDeclared('flex-shrink') || getDeclared('flex-basis') || getDeclared('flex'));
      return { role: role, scrollTag: scrollTag, heightStrategy: heightStrategy, widthStrategy: widthStrategy, isFlexChild: hasFlexDecl };
    }

    function collectNode(el, maxText) {
      try {
        var cs = getComputedStyle(el);
        var rect = el.getBoundingClientRect();
        if (!rect) return null;
        var props = {};
        for (var i = 0; i < LAYOUT_PROPS.length; i++) { props[LAYOUT_PROPS[i]] = cs[LAYOUT_PROPS[i]]; }
        var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, maxText);
        var declared = matchDeclarations(el, WANTED_PROPS);
        var shape = classifyShape(cs, declared);
        var rawClass = el.getAttribute('class') || '';
        return {
          tag: el.tagName.toLowerCase(), id: el.id || null,
          classes: rawClass.split(/\\s+/).filter(Boolean),
          inlineStyle: el.getAttribute('style') || null, text: text, props: props, declared: declared, shape: shape,
          metrics: {
            rect: { x: +rect.x.toFixed(1), y: +rect.y.toFixed(1), width: +rect.width.toFixed(1), height: +rect.height.toFixed(1) },
            rectBottom: +rect.bottom.toFixed(1), rectRight: +rect.right.toFixed(1),
            offsetHeight: el.offsetHeight, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight,
            clientWidth: el.clientWidth, scrollWidth: el.scrollWidth,
          },
          flags: {
            overflowsViewport: rect.bottom > innerHeight + 1 || rect.right > innerWidth + 1,
            overflowsParent: rect.bottom > (el.parentElement ? el.parentElement.getBoundingClientRect().bottom + 1 : innerHeight),
            hasScrollY: el.scrollHeight > el.clientHeight + 1, hasScrollX: el.scrollWidth > el.clientWidth + 1,
            scrollable: (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0,
          },
          containingBlockModifiers: CB_PROPS.filter(function(p) { var v = cs[p]; return v && v !== 'none' && v !== 'auto' && v !== 'normal' && v !== 'visible' && v !== 'false'; }).map(function(p) { return p + ': ' + cs[p]; }),
        };
      } catch(e) { return null; }
    }

    function isSameShape(a, b) {
      return !!a && !!b && a.tagName === b.tagName && a.id === b.id && (a.getAttribute('class') || '') === (b.getAttribute('class') || '');
    }

    function buildTree(el, depth, state) {
      if (!el || state.count >= c.MAX_NODES || depth < 0) return null;
      state.count++;
      var collected = collectNode(el, 40);
      if (!collected) return null;
      var node = Object.assign({}, collected, { children: [] });
      var kids = Array.from(el.children);
      if (depth > 0) {
        var i = 0;
        while (i < kids.length) {
          var run = [kids[i]];
          var j = i + 1;
          while (j < kids.length && isSameShape(kids[i], kids[j])) { run.push(kids[j]); j++; }
          var rep = buildTree(run[0], depth - 1, state);
          if (rep) { node.children.push(Object.assign({}, rep, { repeat: run.length })); }
          i = j;
        }
      }
      return node;
    }

    function walkUp(el, stopTag) {
      var chain = [];
      var cur = el;
      while (cur && cur.tagName.toLowerCase() !== stopTag) { chain.unshift(cur); cur = cur.parentElement; }
      if (cur) chain.unshift(cur);
      return chain;
    }

    function analyzeShape(rootNode, ancestors) {
      var findings = [];
      var chainShapes = ancestors.map(function(a) {
        return { label: a.label, role: a.shape.role, scrollTag: a.shape.scrollTag, hStrategy: a.shape.heightStrategy, wStrategy: a.shape.widthStrategy, isFlexChild: a.shape.isFlexChild, computed: { w: a.metrics.clientWidth, h: a.metrics.offsetHeight } };
      });
      findings.push('## Shape chain (root\\u2192up)');
      for (var i = 0; i < chainShapes.length; i++) {
        var s = chainShapes[i];
        findings.push('  ' + s.label + ': ' + s.role + (s.scrollTag ? ' ' + s.scrollTag : '') + ' | h:' + s.hStrategy + ' w:' + s.wStrategy + ' | ' + s.computed.w + '\\u00d7' + s.computed.h + (s.isFlexChild ? ' flex-child' : ''));
      }
      var scrollNodes = [];
      (function collectScroll(n) { if (!n) return; if (n.flags.hasScrollY || n.props.overflowY === 'auto' || n.props.overflowY === 'scroll') scrollNodes.push(n); for (var ci = 0; ci < n.children.length; ci++) collectScroll(n.children[ci]); })(rootNode);
      var constraintNodes = [];
      (function collectOverflow(n, parent) { if (!n) return; var ph = parent && parent.metrics.clientHeight > 0; if (n.flags.overflowsParent && !(n.props.overflowY === 'auto' || n.props.overflowY === 'scroll') && ph) constraintNodes.push(n); for (var ci = 0; ci < n.children.length; ci++) collectOverflow(n.children[ci], n); })(rootNode, null);
      if (rootNode && rootNode.flags.overflowsParent && !(rootNode.props.overflowY === 'auto' || rootNode.props.overflowY === 'scroll')) constraintNodes.push(rootNode);
      findings.push('## Scroll analysis');
      for (var si2 = 0; si2 < Math.min(constraintNodes.length, 8); si2++) {
        var cn = constraintNodes[si2]; var cl = cn.tag + '.' + (cn.classes || []).join('.');
        findings.push('\\u26a0 ' + cl + ' overflows parent but is not a scroll container \\u2192 constraint candidate');
      }
      for (var si3 = 0; si3 < scrollNodes.length; si3++) {
        var sn = scrollNodes[si3]; var sl = sn.tag + '.' + (sn.classes || []).join('.');
        if (sn.flags.scrollable) { findings.push('\\u2714 ' + sl + ' scrollable (scrollHeight ' + sn.metrics.scrollHeight + ' > clientHeight ' + sn.metrics.clientHeight + ')'); }
        else if (!sn.flags.hasScrollY && sn.metrics.clientHeight === 0) { findings.push('\\u26a0 ' + sl + ' height collapsed to 0 \\u2192 anchor issue'); }
        else if (!sn.flags.hasScrollY) { findings.push('\\u2714 ' + sl + ' no overflow, no scroll needed'); }
        else { findings.push('\\u26a0 ' + sl + ' content overflows (' + sn.metrics.scrollHeight + '>' + sn.metrics.clientHeight + ') clipped by overflow=' + sn.props.overflowY); }
      }
      findings.push('## Height anchor');
      var anchorInfo = ancestors.map(function(a) {
        var dh = (a.declared && a.declared.height) || [];
        var first = dh.find(function(d) { return d.selector === 'inline'; }) || dh[0] || null;
        var mh = (a.declared && a.declared['max-height']) || [];
        var maxFirst = mh.find(function(d) { return d.selector === 'inline'; }) || mh[0] || null;
        return { label: a.label, declared: first ? first.value + ' (' + first.selector + ' ' + first.href + ')' : '(no height declaration)', maxDeclared: maxFirst ? maxFirst.value + ' (' + maxFirst.selector + ')' : null, computed: a.props.height, hasAbsolute: !!(first && /^(0|[1-9]\\d*)(\\.\\d+)?(px|vh|vw|rem|em)$/.test(first.value)) };
      });
      var anchored = anchorInfo.find(function(a) { return a.hasAbsolute; });
      findings.push('Anchor check: ' + (anchored ? 'chain has absolute-unit height at ' + anchored.label + ': ' + anchored.declared : 'all heights are % or missing'));
      for (var ai = 0; ai < anchorInfo.length; ai++) { findings.push('  - ' + anchorInfo[ai].label + ': declared ' + anchorInfo[ai].declared + ' \\u2192 computed ' + anchorInfo[ai].computed); }
      findings.push('## Width analysis');
      findings.push('## Flex constraints');
      var flexParents = [];
      (function collectFP(n, parent) { if (!n) return; if (parent && (parent.props.display === 'flex' || parent.props.display === 'inline-flex')) flexParents.push({ parent: parent, child: n }); for (var ci = 0; ci < n.children.length; ci++) collectFP(n.children[ci], n); })(rootNode, null);
      for (var fi = 0; fi < Math.min(flexParents.length, 10); fi++) {
        var fp = flexParents[fi]; var pDir = fp.parent.props.flexDirection || 'row';
        if (pDir === 'column' && (fp.child.props.minHeight === 'auto' || fp.child.props.minHeight === '0px')) {
          if (fp.child.metrics.scrollHeight > fp.child.metrics.clientHeight + 1) { findings.push('\\u26a0 ' + fp.child.tag + ' is flex-col child with min-height:' + fp.child.props.minHeight + ' \\u2192 may overflow'); }
        }
      }
      if (flexParents.length === 0) findings.push('  No flex parent-child relationships found in the tree');
      findings.push('## Containing block');
      var cbNodes = [];
      (function collectCB(n) { if (!n) return; if (n.containingBlockModifiers && n.containingBlockModifiers.length > 0) cbNodes.push(n); for (var ci = 0; ci < n.children.length; ci++) collectCB(n.children[ci]); })(rootNode);
      for (var ci2 = 0; ci2 < Math.min(cbNodes.length, 5); ci2++) { findings.push('  ' + cbNodes[ci2].tag + '.' + (cbNodes[ci2].classes || []).join('.') + ': CB modifiers: ' + cbNodes[ci2].containingBlockModifiers.join(', ')); }
      if (cbNodes.length === 0) findings.push('  No containing block modifiers found in the tree');
      findings.push('## Layout patterns');
      if (ancestors.some(function(a) { return a.shape.role === 'fixed'; }) && !anchored) findings.push('Pattern: fixed ancestor + no height anchor');
      if (ancestors.some(function(a) { return a.shape.role === 'flex-col'; })) { var fc = ancestors.find(function(a) { return a.shape.role === 'flex-col'; }); if (fc) findings.push('Pattern: flex-col at ' + fc.label); }
      if (scrollNodes.find(function(n) { return n.flags.scrollable; }) && !anchored) findings.push('Pattern: scroll container exists but no height anchor above');
      if (ancestors.every(function(a) { return a.shape.heightStrategy === 'content'; })) findings.push('Pattern: all ancestors are content-sized');
      return findings;
    }

    // Main
    var root = document.querySelector(c.ROOT_SELECTOR);
    if (!root) {
      var candidates = Array.from(document.querySelectorAll('.s-kit-modal, [class*="dialog"]')).slice(0, 5).map(function(el) { return el.tagName + '.' + (el.getAttribute('class') || '').split(/\\s+/).filter(Boolean).join('.'); });
      return { error: '\u672A\u627E\u5230 ' + c.ROOT_SELECTOR, candidates: candidates, rootSelector: c.ROOT_SELECTOR, upTo: c.UP_TO, downDepth: c.DOWN_DEPTH, nodeCount: 0, ancestors: [], tree: null, findings: ['\u65E0\u6CD5\u5206\u6790'], crossOriginBlocked: crossOriginBlocked, blockedSheetUrls: blockedSheetUrls.slice(0, 5) };
    }
    var ancestors = walkUp(root, c.UP_TO).map(function(el) { return collectNode(el, 30); }).filter(Boolean).map(function(n) {
      return { label: n.tag + '.' + n.classes.join('.'), props: n.props, metrics: n.metrics, flags: n.flags, declared: n.declared, shape: n.shape, containingBlockModifiers: n.containingBlockModifiers, inlineStyle: n.inlineStyle };
    });
    var state = { count: 0 };
    var tree = buildTree(root, c.DOWN_DEPTH, state);
    var findings = analyzeShape(tree, ancestors);
    return { rootSelector: c.ROOT_SELECTOR, upTo: c.UP_TO, downDepth: c.DOWN_DEPTH, nodeCount: state.count, ancestors: ancestors, tree: tree, findings: findings, crossOriginBlocked: crossOriginBlocked, blockedSheetUrls: blockedSheetUrls.slice(0, 5) };
  })()`;
}

// src/node/renderer.ts
function renderNode(node, indent) {
  const lines = [];
  if (!node) return lines;
  const cls = node.classes.length ? `.${node.classes.join(".")}` : "";
  const id = node.id ? `#${node.id}` : "";
  const repeat = node.repeat ? ` \xD7${node.repeat}` : "";
  const m = node.metrics;
  const s = node.shape || {};
  const flag = [];
  if (node.flags.overflowsViewport) flag.push("\u26A0viewport-overflow");
  if (node.flags.overflowsParent) flag.push("\u26A0parent-overflow");
  if (m.clientHeight === 0 && m.offsetHeight === 0) flag.push("\u26A0collapsed(0px)");
  if (node.flags.scrollable) flag.push("\u2714scrollable");
  if (node.flags.hasScrollY && !node.flags.scrollable) {
    flag.push(`\u26A0overflow(${m.scrollHeight}>${m.clientHeight})but-overflow=${node.props.overflowY}`);
  }
  if (node.containingBlockModifiers.length) {
    flag.push(`CB:${node.containingBlockModifiers.join(" ")}`);
  }
  const styleHint = node.inlineStyle ? ` style="${node.inlineStyle}"` : "";
  const h = node.props.height;
  const heightStr = h === "auto" ? `auto\u2192${m.offsetHeight}px` : `${h}`;
  const w = node.props.width;
  const widthStr = w === "auto" ? `auto\u2192${m.clientWidth}px` : `${w}`;
  const mhStr = node.declared && node.declared["max-height"] ? ` maxH:${node.declared["max-height"].map((x) => x.value).join(";")}` : "";
  const shapeStr = s.role ? `[${s.role}${s.scrollTag ? " " + s.scrollTag : ""} h:${s.heightStrategy} w:${s.widthStrategy}]` : "";
  lines.push(
    `${"  ".repeat(indent)}<${node.tag}${id}${cls}${styleHint}${repeat}> ${shapeStr} [${node.props.position},${node.props.display},h:${heightStr},w:${widthStr}${mhStr}] rect(${m.rect.width}\xD7${m.rect.height}) bottom=${m.rectBottom} scroll=${m.clientHeight}/${m.scrollHeight}` + (flag.length ? ` ${flag.join(" ")}` : "") + (node.text ? ` \u300C${node.text.slice(0, 30)}\u300D` : "")
  );
  for (const child of node.children) {
    lines.push(...renderNode(child, indent + 1));
  }
  return lines;
}
function renderAncestors(chain) {
  return chain.map((a) => {
    const dh = a.declared && a.declared.height ? a.declared.height.map((x) => `${x.selector}\u2192${x.value}`).join("; ") : "auto";
    const dw = a.declared && a.declared.width ? a.declared.width.map((x) => `${x.selector}\u2192${x.value}`).join("; ") : "auto";
    const mh = a.declared && a.declared["max-height"] ? a.declared["max-height"].map((x) => `${x.selector}\u2192${x.value}`).join("; ") : null;
    const maxPart = mh ? ` max-height:${mh}` : "";
    const s = a.shape || {};
    const shapeStr = s.role ? `[${s.role}${s.scrollTag ? " " + s.scrollTag : ""} h:${s.heightStrategy} w:${s.widthStrategy}]` : "";
    return `${a.label} ${shapeStr} [${a.props.position},${a.props.display}] h:${dh}${maxPart} w:${dw} \u2192 ${a.metrics.clientWidth}\xD7${a.metrics.offsetHeight}` + (a.containingBlockModifiers.length ? ` CB:${a.containingBlockModifiers.join(" ")}` : "") + (a.inlineStyle ? ` style="${a.inlineStyle}"` : "");
  });
}
function renderReport(snapshot, vp) {
  const lines = [];
  const vpStr = vp ? `${vp.width}\xD7${vp.height}` : "unknown";
  lines.push("# DOM Reality Report");
  lines.push(`viewport: ${vpStr} | root: ${snapshot.rootSelector} | nodes: ${snapshot.nodeCount}`);
  if (snapshot.error) {
    lines.push(`\u26A0 ${snapshot.error}`);
    if (snapshot.candidates && snapshot.candidates.length) {
      lines.push(`Similar nodes: ${snapshot.candidates.join(", ")}`);
    }
    return lines.join("\n");
  }
  lines.push("");
  lines.push(`## Ancestor chain (root\u2192${snapshot.upTo})`);
  lines.push("```");
  lines.push(...renderAncestors(snapshot.ancestors));
  lines.push("```");
  lines.push("");
  lines.push(`## DOM tree (${snapshot.downDepth} levels deep)`);
  lines.push("```");
  lines.push(...renderNode(snapshot.tree, 0));
  lines.push("```");
  lines.push("");
  for (const f of snapshot.findings) {
    if (f.startsWith("##")) {
      lines.push("");
      lines.push(f);
    } else if (f.startsWith("  ") || f.startsWith("Pattern:")) {
      lines.push(f);
    } else {
      lines.push(`- ${f}`);
    }
  }
  if (snapshot.crossOriginBlocked && snapshot.crossOriginBlocked > 0) {
    lines.push("");
    lines.push("## Cross-origin limitation");
    lines.push(`\u26A0 ${snapshot.crossOriginBlocked} stylesheet(s) blocked by browser security (SecurityError). Declaration values may be incomplete \u2014 computed values from getComputedStyle() are still accurate.`);
    if (snapshot.blockedSheetUrls && snapshot.blockedSheetUrls.length > 0) {
      lines.push(`Blocked: ${snapshot.blockedSheetUrls.join(", ")}`);
    }
    lines.push("Use cssgraph_diagnose for declaration source (file:line) from local source files.");
  }
  return lines.join("\n");
}

// src/config.ts
var CFG_DEFAULTS = {
  ROOT_SELECTOR: ".site-version-history-dialog-wrapper",
  UP_TO: "html",
  DOWN_DEPTH: 6,
  ZOOM_DIAGNOSIS: false,
  MAX_NODES: 60
};

// src/entry.ts
async function main(page) {
  const pageCfg = await page.evaluate(
    () => typeof window !== "undefined" && window.__DOM_REPORT_CFG ? window.__DOM_REPORT_CFG : null
  ).catch(() => null);
  const CFG = { ...CFG_DEFAULTS, ...pageCfg || {} };
  const configJson = JSON.stringify(CFG);
  const scriptFn = new Function(`return ${createSnapshotScript(configJson)}`);
  const base = await page.evaluate(scriptFn);
  let zoomSection = null;
  if (CFG.ZOOM_DIAGNOSIS && !base.error) {
    const vp2 = page.viewportSize();
    if (vp2) {
      await page.setViewportSize({
        width: Math.max(320, Math.round(vp2.width / 2)),
        height: Math.max(320, Math.round(vp2.height / 2))
      });
      await page.waitForTimeout(300);
      const halfFn = new Function(`return ${createSnapshotScript(configJson)}`);
      const half = await page.evaluate(halfFn);
      await page.setViewportSize({ width: vp2.width, height: vp2.height });
      await page.waitForTimeout(300);
      const diffs = [];
      if (base.tree && half.tree) {
        const walk = (n1, n2, path) => {
          if (!n1 || !n2) return;
          for (const k of ["rectBottom", "clientHeight", "scrollHeight"]) {
            if (n1.metrics[k] !== n2.metrics[k]) {
              diffs.push({ path, key: k, a: n1.metrics[k], b: n2.metrics[k] });
            }
          }
          const n1c = n1.children || [];
          const n2c = n2.children || [];
          for (let i = 0; i < Math.max(n1c.length, n2c.length); i++) {
            const c2 = n2c[i] || n1c[i];
            if (!c2) continue;
            walk(n1c[i], n2c[i], `${path} > ${c2.tag}.${(c2.classes || []).join(".")}`);
          }
        };
        walk(base.tree, half.tree, CFG.ROOT_SELECTOR);
      }
      zoomSection = {
        viewportHalf: { width: Math.round(vp2.width / 2), height: Math.round(vp2.height / 2) },
        diffs: diffs.slice(0, 20),
        halfNodeCount: half.nodeCount
      };
    }
  }
  const vp = page.viewportSize();
  const lines = [renderReport(base, vp)];
  if (zoomSection) {
    lines.push("");
    lines.push(`## Zoom \u8BCA\u65AD\uFF081x \u2192 0.5x, viewport ${zoomSection.viewportHalf.width}\xD7${zoomSection.viewportHalf.height}\uFF09`);
    if (zoomSection.diffs.length === 0) {
      lines.push("- \u65E0\u5DEE\u5F02\uFF1A\u5E03\u5C40\u4E0E\u89C6\u53E3\u65E0\u5173\uFF08\u951A\u5B9A\u826F\u597D\u6216\u5185\u5BB9\u81EA\u9002\u5E94\uFF09");
    } else {
      for (const d of zoomSection.diffs) {
        lines.push(`- ${d.path}: ${d.key} ${d.a} \u2192 ${d.b}`);
      }
    }
    lines.push("");
    lines.push("- \u89E3\u91CA: \u82E5 0.5x \u65F6 rectBottom \u4E0D\u518D\u6EA2\u51FA\u89C6\u53E3\u4E14 overflow \u751F\u6548 \u2192 \u5185\u5BB9\u5C3A\u5BF8(auto)\u76D2\u5B50\u6EA2\u51FA\u89C6\u53E3\u7684\u7B7E\u540D \u2192 \u951A\u70B9\u95EE\u9898");
  }
  const out = lines.join("\n");
  console.log(out);
  return out;
}
return await main(page);
}