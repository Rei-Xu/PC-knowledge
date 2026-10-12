/* 電腦小勇士 — 共用核心
 * 鍵盤配置、螢幕鍵盤畫面、音效、localStorage 小工具、老師密碼。
 * 大部分從「注音打字小勇士」(zhuyin-trainer/core.js) 複製過來，差別：
 *   - 鍵盤只印英文原名，不印注音、不印中文提示（不然「切換中/英」會直接洩漏答案）
 *   - 沒有上傳功能，成績只存在這台電腦
 */
window.CQ = (function () {
  'use strict';

  // ---------- 鍵盤配置（標準 104 鍵主鍵區，每排 15 格寬） ----------
  // [code, 鍵上印的字, 寬度(一般鍵=1)]
  const BSLASH = String.fromCharCode(92);
  const ROWS = [
    [['Escape', 'Esc'], null, ['F1', 'F1'], ['F2', 'F2'], ['F3', 'F3'], ['F4', 'F4'], ['F5', 'F5'], ['F6', 'F6'],
     ['F7', 'F7'], ['F8', 'F8'], ['F9', 'F9'], ['F10', 'F10'], ['F11', 'F11'], ['F12', 'F12'], null],
    [['Backquote', '`'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'], ['Digit4', '4'],
     ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'], ['Digit8', '8'], ['Digit9', '9'],
     ['Digit0', '0'], ['Minus', '-'], ['Equal', '='], ['Backspace', 'Backspace', 2]],
    [['Tab', 'Tab', 1.5], ['KeyQ', 'Q'], ['KeyW', 'W'], ['KeyE', 'E'], ['KeyR', 'R'],
     ['KeyT', 'T'], ['KeyY', 'Y'], ['KeyU', 'U'], ['KeyI', 'I'], ['KeyO', 'O'],
     ['KeyP', 'P'], ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', BSLASH, 1.5]],
    [['CapsLock', 'Caps Lock', 1.75], ['KeyA', 'A'], ['KeyS', 'S'], ['KeyD', 'D'], ['KeyF', 'F'],
     ['KeyG', 'G'], ['KeyH', 'H'], ['KeyJ', 'J'], ['KeyK', 'K'], ['KeyL', 'L'],
     ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'Enter', 2.25]],
    [['ShiftLeft', 'Shift', 2.25], ['KeyZ', 'Z'], ['KeyX', 'X'], ['KeyC', 'C'], ['KeyV', 'V'],
     ['KeyB', 'B'], ['KeyN', 'N'], ['KeyM', 'M'], ['Comma', ','], ['Period', '.'],
     ['Slash', '/'], ['ShiftRight', 'Shift', 2.75]],
    [['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', '⊞', 1.25], ['AltLeft', 'Alt', 1.25],
     ['Space', '', 6.25],
     ['AltRight', 'Alt', 1.25], ['MetaRight', '⊞', 1.25], ['ContextMenu', '☰', 1.25], ['ControlRight', 'Ctrl', 1.25]],
  ];
  // 方向鍵（倒 T）＋上面兩排的編輯鍵，畫在主鍵區右邊；null＝空格
  const ARROW_ROWS = [
    [],
    [['Insert', 'Ins'], ['Home', 'Home'], ['PageUp', 'PgUp']],
    [['Delete', 'Del'], ['End', 'End'], ['PageDown', 'PgDn']],
    [],
    [null, ['ArrowUp', '↑'], null],
    [['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']],
  ];
  const CODE_LABEL = {};
  ROWS.concat(ARROW_ROWS).forEach(r => r.forEach(k => { if (k) CODE_LABEL[k[0]] = k[1] || '空白鍵'; }));
  CODE_LABEL.Space = '空白鍵';
  CODE_LABEL.MetaLeft = CODE_LABEL.MetaRight = 'Windows 鍵';
  CODE_LABEL.ContextMenu = '選單鍵';

  // 題庫裡可以寫 'Shift'、'Ctrl' 這種「左右都算」的簡寫
  const ALIAS = {
    Shift: ['ShiftLeft', 'ShiftRight'], Ctrl: ['ControlLeft', 'ControlRight'],
    Alt: ['AltLeft', 'AltRight'], Win: ['MetaLeft', 'MetaRight'],
  };
  function expandCodes(name) { return ALIAS[name] || [name]; }
  function codeLabel(code) {
    for (const k in ALIAS) if (ALIAS[k].includes(code) || k === code) return k === 'Win' ? 'Windows 鍵' : k;
    return CODE_LABEL[code] || code;
  }

  // ---------- 螢幕鍵盤 ----------
  // 寬度用 CSS 變數 --w（幾格寬），實際大小由 style.css 的 --u 依螢幕自動縮放
  function makeKey(k) {
    const el = document.createElement('div');
    if (!k) { el.className = 'key blank'; return el; }
    const [code, label, w] = k;
    el.className = 'key';
    el.dataset.code = code;
    el.style.setProperty('--w', w || 1);
    if ((w || 1) > 1 || label.length > 2) el.classList.add('fn');
    if (/^F\d+$|^Esc$/.test(label)) el.classList.add('frow');
    el.innerHTML = `<span class="name">${label}</span>`;
    return el;
  }
  function renderKeyboard(container) {
    container.innerHTML = '';
    const main = document.createElement('div'); main.className = 'kb-main';
    const arrows = document.createElement('div'); arrows.className = 'kb-arrows';
    ROWS.forEach((row, i) => {
      const div = document.createElement('div'); div.className = 'kb-row' + (i === 0 ? ' frow-row' : '');
      row.forEach(k => div.appendChild(makeKey(k)));
      main.appendChild(div);
      const adiv = document.createElement('div'); adiv.className = 'kb-row' + (i === 0 ? ' frow-row' : '');
      (ARROW_ROWS[i] || []).forEach(k => adiv.appendChild(makeKey(k)));
      arrows.appendChild(adiv);
    });
    container.appendChild(main);
    container.appendChild(arrows);
  }
  function keyEls(container, code) { return container.querySelectorAll(`.key[data-code="${code}"]`); }

  // ---------- 音效（Web Audio，不需外部檔案） ----------
  let actx = null, soundOn = true;
  function setSound(on) { soundOn = !!on; }
  function beep(freq, dur, type, delay) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime + (delay || 0);
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* 忽略 */ }
  }
  const playGood = () => { beep(660, .12); beep(880, .2, 'sine', .1); };
  const playBad = () => beep(180, .25, 'square');
  const playWin = () => [523, 659, 784, 1047].forEach((f, i) => beep(f, .25, 'sine', i * .13));
  const playTick = () => beep(1100, .05, 'triangle');

  // ---------- localStorage 小工具 ----------
  function loadJSON(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 無痕模式等情況忽略 */ } }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- 洗牌發牌器（發完一整輪才重洗，連玩幾場也不會一直遇到同一題） ----------
  function makePicker(list) {
    const pool = (list || []).slice();
    let queue = [], last = null;
    function next() {
      if (!pool.length) return null;
      if (!queue.length) {
        queue = shuffle(pool);
        if (pool.length > 1 && queue[0] === last) queue.push(queue.shift());
      }
      last = queue.shift();
      return last;
    }
    return {
      next,
      take(n) {
        const out = [];
        const max = Math.min(n, pool.length);
        while (out.length < max) {
          const v = next();
          if (v == null) break;
          if (out.indexOf(v) === -1) out.push(v);
        }
        return out;
      },
      size() { return pool.length; },
    };
  }

  function showScreen(name) {
    document.querySelectorAll('section.screen').forEach(el => el.classList.toggle('active', el.id === 'screen-' + name));
    window.scrollTo(0, 0);
  }

  // ---------- 老師密碼（與注音打字小勇士同一組；只存 PBKDF2 雜湊） ----------
  const TEACHER_PW = { salt: 'e902bc884e584a2e7501433d0a8fb918', iter: 200000, hash: '6e5397d47a0d533defc230ebdfa85a68ed0d4367d8c59d71738ab7616072b68b' };
  const hexToBytes = h => new Uint8Array(h.match(/../g).map(b => parseInt(b, 16)));
  async function checkTeacherPassword(pw) {
    if (!window.crypto || !crypto.subtle) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexToBytes(TEACHER_PW.salt), iterations: TEACHER_PW.iter, hash: 'SHA-256' }, key, 256);
    const hex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === TEACHER_PW.hash;
  }

  // ---------- 成績記錄（只存這台電腦，不上傳） ----------
  const LS_RECORDS = 'computerQuiz.records';
  function addRecord(rec) {
    const recs = loadJSON(LS_RECORDS, []);
    recs.push(rec);
    saveJSON(LS_RECORDS, recs);
  }

  return {
    ROWS, CODE_LABEL, expandCodes, codeLabel,
    renderKeyboard, keyEls,
    setSound, beep, playGood, playBad, playWin, playTick,
    loadJSON, saveJSON, escapeHtml, shuffle, showScreen, makePicker,
    checkTeacherPassword, addRecord,
    LS_SETTINGS: 'computerQuiz.settings',
    LS_RECORDS,
    LS_BEST: 'computerQuiz.best',
  };
})();
