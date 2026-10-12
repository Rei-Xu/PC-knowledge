/* 電腦小勇士 — 遊戲主程式
 * 出題 → 依題型畫題目（key 鍵盤 / spot 點圖 / choice 選擇 / sim 模擬操作）→ 判定 → 解說 → 下一題 → 結算
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = CQ.escapeHtml;

  const LEVELS = [
    { id: 1, icon: '⌨️', name: '鍵盤小幫手', desc: 'Shift、Enter、Backspace、Ctrl+C／V…' },
    { id: 2, icon: '🖱️', name: '滑鼠大師', desc: '左鍵、右鍵、滾輪、連點兩下、拖曳' },
    { id: 3, icon: '📁', name: '檔案與資料夾', desc: '打開、新增、重新命名、刪除、存檔' },
    { id: 4, icon: '🪟', name: '桌面與視窗', desc: '開始、工作列、輸入法、關閉／縮小視窗' },
    { id: 5, icon: '🏆', name: '綜合挑戰', desc: '前面四關混在一起，還要計時！' },
  ];
  const TYPE_LABEL = {
    key: '⌨️ 在鍵盤上點出答案（也可以直接按實體鍵盤）',
    spot: '👆 在圖上點出答案',
    choice: '🔘 選出正確答案',
    sim: '🖱️ 動手做做看',
  };

  // ---------- 設定 ----------
  const DEFAULTS = { levels: { 1: true, 2: true, 3: true, 4: true, 5: true }, count: 8, timer: false, sound: true, askName: true };
  let settings = loadSettings();
  function loadSettings() {
    const s = Object.assign({}, DEFAULTS, CQ.loadJSON(CQ.LS_SETTINGS, {}));
    s.levels = Object.assign({}, DEFAULTS.levels, s.levels || {});
    CQ.setSound(s.sound);
    return s;
  }

  // ---------- 首頁 ----------
  function renderHome() {
    const best = CQ.loadJSON(CQ.LS_BEST, {});
    const list = $('level-list');
    list.innerHTML = '';
    LEVELS.filter(l => settings.levels[l.id]).forEach(l => {
      const card = document.createElement('div');
      card.className = 'level-card' + (l.id === 5 ? ' final' : '');
      const b = best[l.id] || 0;
      card.innerHTML = `<div class="num">第 ${l.id} 關</div><div class="name">${l.icon} ${l.name}</div>
        <div class="desc">${l.desc}</div><div class="best">${b ? '⭐'.repeat(b) + '☆'.repeat(3 - b) : '還沒挑戰'}</div>`;
      card.addEventListener('click', () => startLevel(l.id));
      list.appendChild(card);
    });
  }

  // ---------- 一關的狀態 ----------
  const pickers = {};
  let G = null;     // { level, qs, idx, correct, wrong:[], start, timerId }
  let Q = null;     // 這一題 { q, answered, mistakes, keyStep, cleanup:[] }

  function startLevel(id) {
    if (!pickers[id]) {
      const pool = window.QUESTIONS.filter(q => id === 5 ? q.level <= 4 : q.level === id);
      pickers[id] = CQ.makePicker(pool);
    }
    const n = Math.max(3, Math.min(30, settings.count | 0)) + (id === 5 ? 2 : 0);
    G = { level: id, qs: pickers[id].take(n), idx: 0, correct: 0, wrong: [], start: Date.now(), timerId: null };
    const lv = LEVELS.find(l => l.id === id);
    $('level-name').textContent = `${lv.icon} ${lv.name}`;
    const showTimer = settings.timer || id === 5;
    $('timer').classList.toggle('hidden', !showTimer);
    clearInterval(G.timerId);
    if (showTimer) G.timerId = setInterval(() => { $('timer').textContent = `⏱ ${elapsed()} 秒`; }, 500);
    CQ.showScreen('game');
    showQuestion();
  }
  const elapsed = () => Math.round((Date.now() - G.start) / 1000);

  function showQuestion() {
    if (Q) Q.cleanup.forEach(f => f());
    const q = G.qs[G.idx];
    Q = { q, answered: false, mistakes: 0, keyStep: 0, cleanup: [] };
    $('progress').textContent = `${G.idx + 1} / ${G.qs.length}`;
    $('score').textContent = `⭐ ${G.correct}`;
    $('q-type').textContent = TYPE_LABEL[q.type] || '';
    $('q-text').textContent = q.q;
    $('feedback').classList.add('hidden');
    setHint('');
    // 示範動畫（demo）或「亮起某些鍵的小鍵盤」（kbd），放在作答區上面
    const demoBox = $('demo-box');
    demoBox.innerHTML = '';
    demoBox.classList.toggle('hidden', !q.demo && !q.kbd);
    if (q.demo) Q.cleanup.push(DEMO.play(demoBox, q.demo));
    else if (q.kbd) {
      demoBox.innerHTML = '<div class="keyboard mini-kb"></div>';
      const kb = demoBox.firstChild;
      CQ.renderKeyboard(kb);
      q.kbd.forEach(c => CQ.keyEls(kb, c).forEach(k => k.classList.add('next')));
    }
    const stage = $('stage');
    stage.innerHTML = '';
    stage.className = 'stage stage-' + q.type + (q.demo || q.kbd ? ' has-demo' : '');
    ({ key: buildKey, spot: buildSpot, choice: buildChoice, sim: buildSim })[q.type](stage, q);
  }

  function setHint(text, cls) {
    const h = $('hint');
    h.textContent = text || '';
    h.className = 'hint' + (cls ? ' ' + cls : '');
  }

  // 一題結束：ok＝做對（模擬題則是「做完」），沒有失誤才算答對
  function finish(ok, rightAnswerText) {
    if (Q.answered) return;
    Q.answered = true;
    const perfect = ok && Q.mistakes === 0;
    if (perfect) { G.correct++; CQ.playGood(); flash('✅'); }
    else { G.wrong.push(Q.q); if (!ok) CQ.playBad(); }
    $('score').textContent = `⭐ ${G.correct}`;
    let title;
    if (perfect) title = '✅ 答對了！';
    else if (ok) title = `👍 完成了！（剛剛有 ${Q.mistakes} 次小失誤，這題不算星星）`;
    else title = '❌ 答錯了' + (rightAnswerText ? `，正確答案是：${rightAnswerText}` : '，正確答案在黃色框框');
    $('fb-title').textContent = title;
    $('fb-title').className = 'fb-title ' + (perfect ? 'good' : ok ? 'meh' : 'bad');
    $('fb-explain').textContent = '💡 ' + (Q.q.explain || '');
    $('feedback').classList.remove('hidden');
    setHint('');
    $('btn-next').textContent = G.idx + 1 < G.qs.length ? '下一題 ➡' : '看成績 🎉';
    setTimeout(() => { $('btn-next').focus({ preventScroll: true }); $('feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 50);
  }
  // 模擬題做錯一步：記一次失誤，給提示，可以繼續做
  function oops(text) {
    Q.mistakes++;
    CQ.playBad();
    setHint('🙈 ' + text, 'bad');
  }
  function flash(t) {
    const f = $('flash');
    f.textContent = t;
    f.classList.remove('hidden');
    f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    clearTimeout(flash.t);
    flash.t = setTimeout(() => f.classList.add('hidden'), 700);
  }
  $('btn-next').addEventListener('click', () => {
    G.idx++;
    if (G.idx < G.qs.length) showQuestion(); else endLevel();
  });

  // ================= ① 點鍵盤題 =================
  function buildKey(stage, q) {
    const multi = q.keys.length > 1;
    stage.innerHTML = `<div id="combo" class="combo ${multi ? '' : 'hidden'}"></div><div id="kb" class="keyboard"></div>`;
    CQ.renderKeyboard($('kb'));
    renderCombo();
    $('kb').addEventListener('click', e => {
      const k = e.target.closest('.key[data-code]');
      if (k) pressKey(k.dataset.code);
    });
  }
  function renderCombo() {
    const steps = Q.q.keys;
    $('combo').innerHTML = steps.map((s, i) =>
      `<span class="kc ${i < Q.keyStep ? 'done' : ''}">${i < Q.keyStep ? esc(CQ.codeLabel(s[0])) : '？'}</span>`).join('<span class="plus">＋</span>');
  }
  function pressKey(code) {
    if (!Q || Q.answered || Q.q.type !== 'key') return;
    const kb = $('kb');
    const step = Q.q.keys[Q.keyStep];
    const ok = step.some(n => CQ.expandCodes(n).includes(code));
    if (ok) {
      CQ.keyEls(kb, code).forEach(k => k.classList.add('held'));
      Q.keyStep++;
      renderCombo();
      if (Q.keyStep >= Q.q.keys.length) finish(true);
      else CQ.playTick();
    } else {
      CQ.keyEls(kb, code).forEach(k => k.classList.add('wrong'));
      Q.q.keys.forEach(s => s.forEach(n => CQ.expandCodes(n).forEach(c => CQ.keyEls(kb, c).forEach(k => k.classList.add('next')))));
      finish(false, Q.q.keys.map(s => CQ.codeLabel(s[0])).join(' ＋ '));
    }
  }
  // 實體鍵盤也可以作答；Windows 鍵會被作業系統攔走，只接受用滑鼠點
  document.addEventListener('keydown', e => {
    if (!$('screen-game').classList.contains('active') || !Q || Q.q.type !== 'key' || Q.answered) return;
    if (e.target && e.target.tagName === 'INPUT') return;
    e.preventDefault();
    if (e.repeat) return;
    if (/^(Meta|OS)/.test(e.code)) { setHint('Windows 鍵請用滑鼠點螢幕上的鍵盤喔', 'bad'); return; }
    if (!CQ.CODE_LABEL[e.code]) return;
    pressKey(e.code);
  });

  // ================= ② 點圖片題 =================
  function buildSpot(stage, q) {
    stage.innerHTML = `<div class="art-wrap art-${typeof q.art === 'string' ? q.art : q.art.name}">${ART.build(q.art)}</div>`;
    stage.querySelector('svg').addEventListener('click', e => {
      if (Q.answered) return;
      const s = e.target.closest('[data-spot]');
      if (!s) { setHint('沒點到東西喔，再試一次', 'bad'); return; }
      const ok = q.answer.includes(s.dataset.spot);
      if (ok) frameSpot(s, 'ok');
      else {
        frameSpot(s, 'bad');
        q.answer.forEach(a => stage.querySelectorAll(`[data-spot="${a}"]`).forEach(el => frameSpot(el, 'reveal')));
      }
      finish(ok);
    });
  }

  // 在 SVG 上某個可點區域外面畫一圈粗框（綠＝點對、紅＝點錯、黃＝正確答案在這）
  function frameSpot(el, kind) {
    const b = el.getBBox(), pad = 5;
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', b.x - pad); r.setAttribute('y', b.y - pad);
    r.setAttribute('width', b.width + pad * 2); r.setAttribute('height', b.height + pad * 2);
    r.setAttribute('rx', 8);
    r.setAttribute('class', 'spot-frame ' + kind);
    el.ownerSVGElement.appendChild(r);
  }

  // ================= ③ 看圖選擇題 =================
  function buildChoice(stage, q) {
    const order = CQ.shuffle(q.options.map((o, i) => i));
    const hasPics = q.options.some(o => o.icon || o.art);
    stage.innerHTML = (q.art ? `<div class="art-wrap small">${ART.build(q.art)}</div>` : '') +
      `<div class="options ${hasPics ? 'with-pics' : ''}">` + order.map(i => {
        const o = q.options[i];
        const pic = o.icon ? ART.icon(o.icon, 72) : o.art ? `<div class="opt-art">${ART.build(o.art)}</div>` : '';
        return `<button class="opt" data-i="${i}">${pic}<span>${esc(o.t)}</span></button>`;
      }).join('') + '</div>';
    stage.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      if (Q.answered) return;
      const i = +b.dataset.i;
      stage.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.i === q.answer) x.classList.add('right'); });
      if (i !== q.answer) b.classList.add('wrong');
      finish(i === q.answer, q.options[q.answer].t);
    }));
  }

  // ================= ④ 模擬操作題 =================
  function buildSim(stage, q) {
    const s = q.sim;
    if (s.kind === 'scroll') return buildScroll(stage, q);
    const scene = s.scene || 'desktop';
    const chrome = scene === 'explorer'
      ? `<div class="sim-titlebar">📁 文件</div>`
      : `<div class="sim-taskbar"><span class="tb-start">⊞</span><span class="tb-ime">中</span></div>`;
    stage.innerHTML = `<div id="sim" class="sim sim-${scene}">${scene === 'explorer' ? chrome : ''}
      <div class="sim-items">${s.items.map(itemHtml).join('')}</div>${scene === 'desktop' ? chrome : ''}</div>`;
    const sim = $('sim');
    // 整個模擬區都不出現瀏覽器自己的右鍵選單
    sim.addEventListener('contextmenu', e => e.preventDefault());
    ({ dblclick: simDblclick, menu: simMenu, drag: simDrag })[s.kind](sim, s);
  }
  const itemHtml = it => `<div class="sim-item" data-id="${it.id}">${ART.icon(it.icon, 64)}<span class="lbl">${esc(it.label)}</span></div>`;
  const itemOf = (sim, id) => sim.querySelector(`.sim-item[data-id="${id}"]`);
  const labelOf = (s, id) => (s.items.find(i => i.id === id) || {}).label || '';
  function select(sim, el) {
    sim.querySelectorAll('.sim-item.sel').forEach(x => x.classList.remove('sel'));
    if (el) el.classList.add('sel');
  }
  // 打開東西後跳出的假視窗
  function popWindow(sim, title, body) {
    const w = document.createElement('div');
    w.className = 'sim-window';
    w.innerHTML = `<div class="sw-title">${title}<span>— □ ✕</span></div><div class="sw-body">${body}</div>`;
    sim.appendChild(w);
  }

  // --- 連點兩下打開 ---
  function simDblclick(sim, s) {
    let clickTimer = null;
    sim.addEventListener('click', e => {
      if (Q.answered) return;
      const it = e.target.closest('.sim-item');
      select(sim, it);
      if (!it) return;
      clearTimeout(clickTimer);
      // 等一下下再提示，免得「連點兩下」的第一下也跳提示
      clickTimer = setTimeout(() => setHint(`選到「${labelOf(s, it.dataset.id)}」了！點一下只是「選取」，要快速連點兩下才會打開喔`), 450);
    });
    sim.addEventListener('dblclick', e => {
      if (Q.answered) return;
      clearTimeout(clickTimer);
      const it = e.target.closest('.sim-item');
      if (!it) return;
      if (it.dataset.id === s.target) {
        const t = s.items.find(i => i.id === s.target);
        popWindow(sim, `${ART.icon(t.icon, 22)} ${esc(t.label)}`, `<div class="sw-done">🎉 「${esc(t.label)}」打開了！</div>`);
        finish(true);
      } else oops(`打開的是「${labelOf(s, it.dataset.id)}」，不是「${labelOf(s, s.target)}」喔`);
    });
    sim.addEventListener('contextmenu', e => {
      if (Q.answered) return;
      if (e.target.closest('.sim-item')) oops('那是「右鍵」喔！要打開，請用「左鍵」連點兩下');
    });
    Q.cleanup.push(() => clearTimeout(clickTimer));
  }

  // --- 右鍵選單 ---
  function simMenu(sim, s) {
    let menu = null;
    const close = () => { if (menu) { menu.remove(); menu = null; } };
    const onBg = s.target === 'bg';
    const wantWhere = onBg ? '空白的地方' : `「${labelOf(s, s.target)}」上面`;

    function openMenu(x, y) {
      close();
      menu = document.createElement('div');
      menu.className = 'ctx';
      menu.innerHTML = s.menu.map(m => typeof m === 'string'
        ? `<div class="ctx-item" data-t="${esc(m)}">${esc(m)}</div>`
        : `<div class="ctx-item has-sub" data-t="${esc(m.t)}">${esc(m.t)}<span>›</span>
             <div class="ctx sub">${m.sub.map(t => `<div class="ctx-item" data-t="${esc(t)}" data-parent="${esc(m.t)}">${esc(t)}</div>`).join('')}</div></div>`).join('');
      sim.appendChild(menu);
      const r = sim.getBoundingClientRect();
      const left = Math.min(x - r.left, r.width - 190), top = Math.min(y - r.top, r.height - menu.offsetHeight - 4);
      menu.style.left = Math.max(0, left) + 'px';
      menu.style.top = Math.max(0, top) + 'px';
      if (left > r.width - 390) menu.classList.add('sub-left');
      if (top > r.height / 2) menu.classList.add('sub-up');
    }

    sim.addEventListener('contextmenu', e => {
      if (Q.answered) return;
      const it = e.target.closest('.sim-item');
      if (e.target.closest('.ctx')) return;
      const okPlace = onBg ? !it : (it && it.dataset.id === s.target);
      if (!okPlace) { close(); oops(`要在${wantWhere}按右鍵喔`); return; }
      select(sim, it);
      setHint('');
      openMenu(e.clientX, e.clientY);
    });
    sim.addEventListener('click', e => {
      if (Q.answered) return;
      const mi = e.target.closest('.ctx-item');
      if (mi) {
        e.stopPropagation();
        if (mi.classList.contains('has-sub') && !e.target.closest('.sub')) { mi.classList.add('open'); return; }
        const path = mi.dataset.parent ? [mi.dataset.parent, mi.dataset.t] : [mi.dataset.t];
        close();
        if (path.join('/') === s.pick.join('/')) doPicked();
        else oops(`選到「${path.join(' → ')}」了，要選的是「${s.pick.join(' → ')}」，再按一次右鍵試試看`);
        return;
      }
      close();
      const it = e.target.closest('.sim-item');
      select(sim, it);
      if (onBg || (it && it.dataset.id === s.target)) setHint(`要按滑鼠的「右鍵」才會出現選單喔（在${wantWhere}按）`);
    });

    function doPicked() {
      const pick = s.pick[s.pick.length - 1];
      if (s.rename) {
        let it;
        if (onBg) {
          sim.querySelector('.sim-items').insertAdjacentHTML('beforeend', itemHtml({ id: 'new', label: '新增資料夾', icon: 'folder' }));
          it = itemOf(sim, 'new');
        } else it = itemOf(sim, s.target);
        startRename(it);
        return;
      }
      const it = itemOf(sim, s.target);
      if (pick === '刪除') { it.classList.add('gone'); setTimeout(() => finish(true), 450); return; }
      if (pick === '複製') { toast(sim, '📋 已複製！'); finish(true); return; }
      finish(true);
    }
    function startRename(it) {
      const lbl = it.querySelector('.lbl');
      const old = lbl.textContent;
      lbl.innerHTML = `<input class="rename" value="${esc(old)}">`;
      const inp = lbl.querySelector('input');
      inp.focus(); inp.select();
      setHint('現在可以打字了！打好新名字後按 Enter（不想改也可以直接按 Enter）');
      inp.addEventListener('keydown', e => {
        if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
        e.preventDefault();
        const v = inp.value.trim() || old;
        lbl.textContent = v;
        toast(sim, `✏️ 名字改成「${v}」了！`);
        finish(true);
      });
      inp.addEventListener('click', e => e.stopPropagation());
    }
  }
  function toast(sim, text) {
    const t = document.createElement('div');
    t.className = 'sim-toast';
    t.textContent = text;
    sim.appendChild(t);
  }

  // --- 拖曳 ---
  function simDrag(sim, s) {
    let drag = null;
    sim.addEventListener('pointerdown', e => {
      if (Q.answered || e.button !== 0) return;
      const it = e.target.closest('.sim-item');
      select(sim, it);
      if (!it) return;
      e.preventDefault();
      drag = { it, x: e.clientX, y: e.clientY, moved: false, ghost: null, isSrc: it.dataset.id === s.source };
      sim.setPointerCapture(e.pointerId);
    });
    sim.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
        drag.moved = true;
        if (drag.isSrc) {
          drag.ghost = drag.it.cloneNode(true);
          drag.ghost.classList.add('ghost');
          document.body.appendChild(drag.ghost);
          drag.it.classList.add('dragging');
        }
      }
      if (drag.ghost) {
        drag.ghost.style.left = e.clientX - 50 + 'px';
        drag.ghost.style.top = e.clientY - 45 + 'px';
        const over = document.elementFromPoint(e.clientX, e.clientY);
        const t = over && over.closest('.sim-item');
        sim.querySelectorAll('.sim-item.drop').forEach(x => x.classList.remove('drop'));
        if (t && t !== drag.it) t.classList.add('drop');
      }
    });
    const end = e => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.ghost) d.ghost.remove();
      d.it.classList.remove('dragging');
      sim.querySelectorAll('.sim-item.drop').forEach(x => x.classList.remove('drop'));
      if (Q.answered) return;
      if (!d.moved) { setHint(`要「按住左鍵不放」，把「${labelOf(s, s.source)}」拖到「${labelOf(s, s.target)}」上面再放開喔`); return; }
      if (!d.isSrc) { oops(`要拖的是「${labelOf(s, s.source)}」喔`); return; }
      const over = e.type === 'pointerup' && document.elementFromPoint(e.clientX, e.clientY);
      const t = over && over.closest('.sim-item');
      if (t && t.dataset.id === s.target) {
        d.it.classList.add('gone');
        t.classList.add('got');
        toast(sim, `✅ 「${labelOf(s, s.source)}」放進「${labelOf(s, s.target)}」了！`);
        finish(true);
      } else if (t && t !== d.it) oops(`放到「${labelOf(s, t.dataset.id)}」了，要放進「${labelOf(s, s.target)}」喔`);
      else setHint(`要拖到「${labelOf(s, s.target)}」上面，等它變藍色再放開喔`);
    };
    sim.addEventListener('pointerup', end);
    sim.addEventListener('pointercancel', end);
    Q.cleanup.push(() => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; });
  }

  // --- 滾輪找寶藏 ---
  const SCROLL_ROWS = ['🍎 蘋果', '🐶 小狗', '🚗 汽車', '🌈 彩虹', '📚 書本', '⚽ 足球', '🎈 氣球', '🌙 月亮', '🐱 小貓', '🍉 西瓜',
    '✏️ 鉛筆', '🚲 腳踏車', '🌻 向日葵', '🐟 小魚', '🎵 音符', '🍰 蛋糕', '🦋 蝴蝶', '⭐ 星星', '🐢 烏龜', '🍌 香蕉',
    '🚀 火箭', '🎨 調色盤', '🐘 大象', '☂️ 雨傘', '🍓 草莓', '🐧 企鵝', '🎁 禮物', '🌳 大樹', '🐰 兔子', '🍩 甜甜圈',
    '🚂 火車', '🐼 熊貓', '🍇 葡萄', '🧩 拼圖', '🐝 蜜蜂'];
  function buildScroll(stage) {
    const rows = CQ.shuffle(SCROLL_ROWS);
    const at = 26 + Math.floor(Math.random() * 6);
    rows.splice(at, 0, '🏆 寶藏');
    stage.innerHTML = `<div class="sim sim-scroll"><div class="scroll-hint">⬇ 用滑鼠滾輪往下捲 ⬇</div>
      <div id="scroll-box" class="scroll-box">${rows.map(r => `<div class="srow${r === '🏆 寶藏' ? ' treasure' : ''}">${r}</div>`).join('')}</div></div>`;
    $('scroll-box').addEventListener('click', e => {
      if (Q.answered) return;
      const r = e.target.closest('.srow');
      if (!r) return;
      if (r.classList.contains('treasure')) { r.classList.add('found'); finish(true); }
      else oops(`「${r.textContent}」不是寶藏喔，繼續往下捲！`);
    });
  }

  // ---------- 結算 ----------
  function endLevel() {
    clearInterval(G.timerId);
    if (Q) Q.cleanup.forEach(f => f());
    const total = G.qs.length, acc = Math.round(G.correct / total * 100), time = elapsed();
    const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    G.result = { total, acc, time, stars };
    const best = CQ.loadJSON(CQ.LS_BEST, {});
    if ((best[G.level] || 0) < stars) { best[G.level] = stars; CQ.saveJSON(CQ.LS_BEST, best); }
    const lv = LEVELS.find(l => l.id === G.level);
    $('result-level').textContent = `第 ${lv.id} 關　${lv.icon} ${lv.name}`;
    $('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('r-correct').textContent = G.correct;
    $('r-total').textContent = total;
    $('r-acc').textContent = acc + '%';
    $('r-time').textContent = time + ' 秒';
    $('review').innerHTML = G.wrong.length
      ? '<h3>📖 再複習一下這幾題：</h3>' + G.wrong.map(q => `<div class="rv"><b>${esc(q.q)}</b><br>💡 ${esc(q.explain || '')}</div>`).join('')
      : '<h3>🏅 全部答對，太厲害了！</h3>';
    $('record-box').classList.toggle('hidden', !settings.askName);
    $('record-name').value = '';
    $('record-msg').textContent = '';
    $('btn-save-record').disabled = false;
    const next = LEVELS.find(l => l.id > G.level && settings.levels[l.id]);
    $('btn-next-level').classList.toggle('hidden', !next);
    $('btn-next-level').onclick = next ? () => startLevel(next.id) : null;
    CQ.showScreen('result');
    CQ.playWin();
  }
  $('btn-save-record').addEventListener('click', () => {
    const name = $('record-name').value.trim();
    if (!name) { $('record-msg').textContent = '請先輸入座號或姓名'; return; }
    const r = G.result;
    CQ.addRecord({
      date: new Date().toLocaleString('zh-TW', { hour12: false }), name, level: `第${G.level}關`,
      correct: G.correct, total: r.total, acc: r.acc, time: r.time, stars: r.stars,
      wrong: G.wrong.map(q => q.q).join('｜'),
    });
    $('record-msg').textContent = '✅ 已記錄在這台電腦';
    $('btn-save-record').disabled = true;
  });
  $('btn-skip-record').addEventListener('click', () => $('record-box').classList.add('hidden'));
  $('btn-retry').addEventListener('click', () => startLevel(G.level));
  $('btn-result-home').addEventListener('click', goHome);
  $('btn-quit').addEventListener('click', () => {
    if (G && G.idx > 0 && !confirm('現在離開，這一關的成績不會記錄喔。確定要回首頁嗎？')) return;
    goHome();
  });
  function goHome() {
    if (G) clearInterval(G.timerId);
    if (Q) { Q.cleanup.forEach(f => f()); Q = null; }
    renderHome();
    CQ.showScreen('home');
  }

  // ---------- 老師模式 ----------
  function openPwDialog() {
    $('pw-input').value = ''; $('pw-msg').textContent = '';
    $('pw-dialog').classList.remove('hidden');
    setTimeout(() => $('pw-input').focus(), 50);
  }
  function closePwDialog() { $('pw-dialog').classList.add('hidden'); }
  async function submitPw() {
    const pw = $('pw-input').value;
    if (!pw) return;
    $('pw-msg').textContent = '檢查中…'; $('btn-pw-ok').disabled = true;
    const ok = await CQ.checkTeacherPassword(pw).catch(() => false);
    $('btn-pw-ok').disabled = false;
    if (!ok) { $('pw-msg').textContent = '密碼不對喔'; $('pw-input').value = ''; $('pw-input').focus(); return; }
    closePwDialog();
    renderSettingsForm(); renderRecords(); CQ.showScreen('teacher');
  }
  $('btn-teacher').addEventListener('click', openPwDialog);
  $('btn-pw-ok').addEventListener('click', submitPw);
  $('btn-pw-cancel').addEventListener('click', closePwDialog);
  $('pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitPw(); else if (e.key === 'Escape') closePwDialog(); });
  $('btn-teacher-quit').addEventListener('click', goHome);

  function renderSettingsForm() {
    const counts = {};
    window.QUESTIONS.forEach(q => { counts[q.level] = (counts[q.level] || 0) + 1; });
    $('settings-form').innerHTML =
      LEVELS.map(l => `<label>開放 第 ${l.id} 關 ${l.name}${l.id < 5 ? `（題庫 ${counts[l.id] || 0} 題）` : ''}
        <input type="checkbox" data-level="${l.id}" ${settings.levels[l.id] ? 'checked' : ''}></label>`).join('') +
      `<label>每關題數（3～30；綜合挑戰會多 2 題）<input type="number" id="set-count" min="3" max="30" value="${settings.count}"></label>
       <label>每一關都計時（綜合挑戰一定計時）<input type="checkbox" id="set-timer" ${settings.timer ? 'checked' : ''}></label>
       <label>音效<input type="checkbox" id="set-sound" ${settings.sound ? 'checked' : ''}></label>
       <label>結算時顯示「輸入姓名記錄成績」<input type="checkbox" id="set-askname" ${settings.askName ? 'checked' : ''}></label>`;
    $('settings-msg').textContent = '';
  }
  $('btn-save-settings').addEventListener('click', () => {
    const levels = {};
    document.querySelectorAll('#settings-form [data-level]').forEach(c => { levels[c.dataset.level] = c.checked; });
    settings = {
      levels, count: Math.max(3, Math.min(30, parseInt($('set-count').value, 10) || 8)),
      timer: $('set-timer').checked, sound: $('set-sound').checked, askName: $('set-askname').checked,
    };
    CQ.saveJSON(CQ.LS_SETTINGS, settings);
    CQ.setSound(settings.sound);
    renderSettingsForm();
    $('settings-msg').textContent = '✅ 已儲存';
  });
  $('btn-reset-settings').addEventListener('click', () => {
    CQ.saveJSON(CQ.LS_SETTINGS, {});
    settings = loadSettings();
    renderSettingsForm();
    $('settings-msg').textContent = '✅ 已恢復預設';
  });

  function renderRecords() {
    const recs = CQ.loadJSON(CQ.LS_RECORDS, []).slice().reverse();
    $('records-table').querySelector('tbody').innerHTML = recs.length
      ? recs.map(r => `<tr><td>${esc(r.date)}</td><td>${esc(r.name)}</td><td>${esc(r.level)}</td><td>${r.correct}</td><td>${r.total}</td>
          <td>${r.acc}%</td><td>${r.time} 秒</td><td>${'⭐'.repeat(r.stars)}</td><td class="wrong-col">${esc(r.wrong || '')}</td></tr>`).join('')
      : '<tr><td colspan="9">還沒有記錄</td></tr>';
  }
  $('btn-export-csv').addEventListener('click', () => {
    const recs = CQ.loadJSON(CQ.LS_RECORDS, []);
    if (!recs.length) { alert('還沒有記錄'); return; }
    const cell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [['日期', '座號／姓名', '關卡', '答對', '題數', '正確率(%)', '時間(秒)', '星星', '答錯的題目']]
      .concat(recs.map(r => [r.date, r.name, r.level, r.correct, r.total, r.acc, r.time, r.stars, r.wrong]))
      .map(row => row.map(cell).join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `電腦小勇士成績_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('btn-clear-records').addEventListener('click', () => {
    if (!confirm('確定要清空這台電腦的所有成績記錄嗎？清掉就找不回來了（建議先匯出 CSV）。')) return;
    CQ.saveJSON(CQ.LS_RECORDS, []);
    renderRecords();
  });

  renderHome();
  // 給自動測試用：window.__CQ_TEST.start(1) 直接開某一關
  window.__CQ_TEST = { start: startLevel, get G() { return G; }, get Q() { return Q; } };
})();
