/**
 * DOM Reality Report — 真实 DOM 结构 + Render 效果取证脚本
 *
 * 用法（两步）:
 *   1. playwright-cli eval "() => { window.__DOM_REPORT_CFG = { ROOT_SELECTOR: '.xxx', ZOOM_DIAGNOSIS: true } }"
 *   2. playwright-cli run-code --filename scripts/dom-report.js
 *
 * 配置（可省略，用默认值；也可直接改下方 CFG_DEFAULTS）:
 *   ROOT_SELECTOR   问题根节点（默认 .site-version-history-dialog-wrapper）
 *   UP_TO           祖先链向上走到哪一级（默认 html，可按工单调整如 body）
 *   DOWN_DEPTH      向下展开层数（默认 6）
 *   ZOOM_DIAGNOSIS  是否在 1x / 0.5x 各测一次并输出差异（默认 false）
 *   MAX_NODES       节点数上限防 context 爆炸（默认 60）
 *
 * 输出三层合一（Markdown）:
 *   1. 真实 DOM 树（tag/class/id/inline style/文本摘要，重复结构聚合为 1 代表 + 计数）
 *   2. Render 效果（每节点 rect、scrollHeight/clientHeight、containing-block 检查）
 *   3. 判定行（锚点断裂点 + 修复层）
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

    const collectNode = (el, maxText) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const props = {};
      for (const p of LAYOUT_PROPS) props[p] = cs[p];
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, maxText);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: (typeof el.className === 'string' && el.className) ? el.className.split(/\s+/).filter(Boolean) : [],
        inlineStyle: el.getAttribute('style') || null,
        text,
        props,
        declared: matchDeclarations(el, ['height', 'max-height', 'min-height', 'overflow', 'position', 'display', 'box-sizing', 'flex', 'flex-direction', 'align-items']),
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

    const analyzeAnchors = (rootNode, ancestors) => {
      const findings = [];
      const scrollNodes = [];
      const collectScroll = (n) => {
        if (!n) return;
        if (n.flags.hasScrollY || n.props.overflowY === 'auto' || n.props.overflowY === 'scroll') scrollNodes.push(n);
        for (const child of n.children) collectScroll(child);
      };
      collectScroll(rootNode);
      // 非滚动容器溢出父级 → 约束问题候选。仅当父容器有正常高度（clientHeight>0，非塌陷连锁）时才有意义
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
      // root 自身溢出父级时，用真实父元素判断父容器健康度
      if (rootNode.flags.overflowsParent && !(rootNode.props.overflowY === 'auto' || rootNode.props.overflowY === 'scroll')) {
        const pEl = root.parentElement;
        if (pEl && pEl.clientHeight > 0) constraintNodes.push(rootNode);
      }
      for (const n of constraintNodes.slice(0, 8)) {
        const label = `${n.tag}.${(n.classes || []).join('.')}`;
        findings.push(`⚠ ${label} 溢出父级但非滚动容器 → 约束问题候选（flex 子项 min-height:auto 撑破 / 父级高度未受限）`);
      }
      for (const n of scrollNodes) {
        const label = `${n.tag}.${(n.classes || []).join('.')}`;
        const isScrollDeclared = n.props.overflowY === 'auto' || n.props.overflowY === 'scroll';
        if (n.flags.scrollable) {
          findings.push(`✔ ${label} 可滚动（scrollHeight ${n.metrics.scrollHeight} > clientHeight ${n.metrics.clientHeight}）`);
        } else if (!n.flags.hasScrollY && n.metrics.clientHeight === 0) {
          findings.push(`⚠ ${label} 高度塌陷为 0 → overflow-y:auto 无可用视区 → 高度链未受限（锚点问题）`);
        } else if (!n.flags.hasScrollY && isScrollDeclared && Math.abs(n.metrics.offsetHeight - n.metrics.scrollHeight) <= 1) {
          // 滚动容器高度 == 内容高度（计算值恒为 px，不能靠 props.height==='auto' 判断）
          findings.push(`⚠ ${label} 高度为内容尺寸(${n.metrics.offsetHeight}px, scrollHeight==clientHeight) → overflow-y:auto 永不触发 → 滚动链未受限（锚点问题）`);
        } else if (!n.flags.hasScrollY) {
          findings.push(`✔ ${label} 无溢出，无需滚动`);
        } else if (n.metrics.clientHeight === 0) {
          findings.push(`⚠ ${label} 内容溢出(${n.metrics.scrollHeight}>0)且视区为 0（clientHeight=0）→ overflow=${n.props.overflowY} 无可用空间 → 高度链未受限（锚点问题）`);
        } else {
          findings.push(`⚠ ${label} 内容溢出(${n.metrics.scrollHeight}>${n.metrics.clientHeight})被 overflow=${n.props.overflowY} 裁切 → 高度链未受限（锚点问题）`);
        }
      }
      // 锚点判定基于声明值：计算值(height)全是 px 无法区分 % / 绝对单位
      const anchorInfo = ancestors.map(a => {
        // inline 声明优先（可覆盖 stylesheet），其余取第一条
        const dh = (a.declared && a.declared.height) || [];
        const first = dh.find(d => d.selector === 'inline') || dh[0] || null;
        // max-height 声明：上限约束 ≠ 锚点，单独列出避免误导
        const mh = (a.declared && a.declared['max-height']) || [];
        const maxFirst = mh.find(d => d.selector === 'inline') || mh[0] || null;
        return {
          label: a.label,
          declared: first ? `${first.value} (${first.selector} ${first.href})` : '(无 height 声明)',
          maxDeclared: maxFirst ? `${maxFirst.value} (${maxFirst.selector} ${maxFirst.href})` : null,
          computed: a.props.height,
          hasAbsolute: !!(first && /^(0|[1-9]\d*)(\.\d+)?(px|vh|vw|rem|em)$/.test(first.value)),
          hasPercent: !!(first && first.value.endsWith('%')),
        };
      });
      const anchored = anchorInfo.find(a => a.hasAbsolute);
      findings.push(`锚点检查: ${anchored ? `链中含绝对单位 height 声明 ${anchored.label}: ${anchored.declared}` : '链中所有 height 均为 % 或无声明 → 全链依赖 containing block 运行时解析（可能为 auto）'}`);
      for (const a of anchorInfo) {
        const maxPart = a.maxDeclared ? ` | max-height:${a.maxDeclared}` : '';
        findings.push(`  - ${a.label}: 声明 ${a.declared}${maxPart} → 计算 ${a.computed}`);
      }
      // max-height 是上限不是锚：若某级仅 max-height 而无 height，提示其不能为 % 子级提供确定性高度
      const maxOnly = anchorInfo.filter(a => !a.declared.includes('px') && !a.declared.includes('vh') && a.maxDeclared);
      if (maxOnly.length) {
        findings.push(`⚠ 以下节点仅有 max-height（上限）无 height 声明 → % 子级仍解析为 auto，不构成锚点: ${maxOnly.map(a => a.label).join(', ')}`);
      }
      if (rootNode.props.position === 'fixed' && /%/.test(rootNode.props.height)) {
        findings.push(`⚠ 根节点为 position:fixed + 百分比高度（计算值 ${rootNode.metrics.offsetHeight}px）— 锚定依赖 containing block，静态不可证，以本报告计算值为准`);
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
        containingBlockModifiers: n.containingBlockModifiers,
        inlineStyle: n.inlineStyle,
      };
    });
    const state = { count: 0 };
    const tree = buildTree(root, c.DOWN_DEPTH, state);
    const findings = analyzeAnchors(tree, ancestors);
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
    const flag = [];
    if (node.flags.overflowsViewport) flag.push('⚠溢出视口');
    if (node.flags.overflowsParent) flag.push('⚠溢出父级');
    if (m.clientHeight === 0 && m.offsetHeight === 0) flag.push('⚠高度塌陷(0px)');
    if (node.flags.scrollable) flag.push('✔可滚动');
    if (node.flags.hasScrollY && !node.flags.scrollable) flag.push(`⚠有溢出(${m.scrollHeight}>${m.clientHeight})但overflow=${node.props.overflowY}`);
    if (node.containingBlockModifiers.length) flag.push(`CB:${node.containingBlockModifiers.join(' ')}`);
    const styleHint = node.inlineStyle ? ` style="${node.inlineStyle}"` : '';
    const h = node.props.height;
    const heightStr = h === 'auto' ? `auto→${m.offsetHeight}px` : `${h}`;
    const mhStr = node.declared && node.declared['max-height'] ? ` maxH:${node.declared['max-height'].map(x => x.value).join(';')}` : '';
    lines.push(
      `${'  '.repeat(indent)}<${node.tag}${id}${cls}${styleHint}${repeat}>` +
      ` [${node.props.position},${node.props.display},h:${heightStr}${mhStr}]` +
      ` rect(${m.rect.width}×${m.rect.height}) bottom=${m.rectBottom} scroll=${m.clientHeight}/${m.scrollHeight}` +
      (flag.length ? ` ${flag.join(' ')}` : '') +
      (node.text ? ` 「${node.text.slice(0, 30)}」` : ''),
    );
    for (const child of node.children) lines.push(...renderNode(child, indent + 1));
    return lines;
  };

  const renderAncestors = (chain) => chain.map(a => {
    const d = (a.declared && a.declared.height) ? a.declared.height.map(x => `${x.selector}→${x.value}`).join('; ') : 'auto';
    const m = (a.declared && a.declared['max-height']) ? a.declared['max-height'].map(x => `${x.selector}→${x.value}`).join('; ') : null;
    const maxPart = m ? ` max-height:${m}` : '';
    return `${a.label} [${a.props.position},${a.props.display}] 声明height:${d}${maxPart} → 计算${a.metrics.offsetHeight}px rect.bottom=${a.metrics.rectBottom}` +
      (a.containingBlockModifiers.length ? ` CB:${a.containingBlockModifiers.join(' ')}` : '') +
      (a.inlineStyle ? ` style="${a.inlineStyle}"` : '');
  });

  const renderReport = (snapshot, vp) => {
    const lines = [];
    lines.push(`# DOM Reality Report`);
    lines.push(`viewport: ${vp.width}×${vp.height} | root: ${snapshot.rootSelector} | 节点数: ${snapshot.nodeCount}`);
    if (snapshot.error) {
      lines.push(`⚠ ${snapshot.error}`);
      if (snapshot.candidates && snapshot.candidates.length) {
        lines.push(`候选相似节点: ${snapshot.candidates.join(', ')}`);
      }
      return lines.join('\n');
    }
    lines.push('');
    lines.push(`## 祖先链（root 向上到 ${snapshot.upTo}）`);
    lines.push('```');
    lines.push(...renderAncestors(snapshot.ancestors));
    lines.push('```');
    lines.push('');
    lines.push(`## 真实 DOM 树（向下 ${snapshot.downDepth} 层）`);
    lines.push('```');
    lines.push(...renderNode(snapshot.tree, 0));
    lines.push('```');
    lines.push('');
    lines.push('## 判定');
    for (const f of snapshot.findings) lines.push(`- ${f}`);
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