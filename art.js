/* 電腦小勇士 — 題目圖片（全部用程式畫的 SVG，不需要外部圖檔、離線也能用）
 *
 * 每張大圖裡「可以點的地方」都包在 <g data-spot="名稱"> 裡，
 * 題庫 (questions.js) 的 spot 題就是寫「答案是哪個名稱」。
 *
 *   ART.mouse()     滑鼠：left 左鍵 / right 右鍵 / wheel 滾輪 / body 握的地方
 *   ART.desktop()   Windows 桌面：start 開始 / taskbar 工作列 / search 搜尋 / explorer 檔案總管 /
 *                   chrome 瀏覽器 / ime 輸入法 / clock 時鐘 / volume 喇叭 / wifi 網路 /
 *                   pc 本機 / recycle 資源回收筒 / folder 資料夾 / wallpaper 桌面空白處
 *   ART.window()    記事本視窗：min 最小化 / max 最大化 / close 關閉 / title 標題列 /
 *                   menu-file 檔案選單 / content 內容
 *   ART.explorer()  檔案總管：back 上一頁 / up 上一層 / address 網址列 / search 搜尋框 /
 *                   new 新增 / navpane 左邊窗格 / folder 資料夾 / file 檔案 / close 關閉
 *
 * 小圖示（選項、模擬操作用）：ART.icon('folder' | 'recycle' | 'pc' | 'txt' | 'jpg' | 'app' | 'trophy' ...)
 */
window.ART = (function () {
  'use strict';

  // ---------- 小圖示：回傳 SVG 片段（畫在 0~48 的方格裡），外層自己決定位置 ----------
  const GLYPH = {
    folder: `<path d="M3 12 Q3 8 7 8 L18 8 L22 12 L41 12 Q45 12 45 16 L45 38 Q45 42 41 42 L7 42 Q3 42 3 38 Z" fill="#e8a317"/>
             <path d="M3 18 L45 18 L45 38 Q45 42 41 42 L7 42 Q3 42 3 38 Z" fill="#ffc83d"/>`,
    recycle: `<path d="M11 14 L37 14 L34 44 L14 44 Z" fill="#d7e6f5" stroke="#5a7fa8" stroke-width="2"/>
              <rect x="8" y="9" width="32" height="5" rx="2" fill="#9cb8d6" stroke="#5a7fa8" stroke-width="2"/>
              <path d="M19 20 L20 39 M24 20 L24 39 M29 20 L28 39" stroke="#5a7fa8" stroke-width="2"/>`,
    pc: `<rect x="4" y="7" width="40" height="27" rx="3" fill="#3b78c4"/><rect x="7" y="10" width="34" height="21" fill="#9fd0ff"/>
         <rect x="20" y="34" width="8" height="6" fill="#777"/><rect x="13" y="40" width="22" height="3" rx="1" fill="#777"/>`,
    txt: `<path d="M9 3 L31 3 L40 12 L40 45 L9 45 Z" fill="#fff" stroke="#888" stroke-width="2"/><path d="M31 3 L31 12 L40 12" fill="#ddd" stroke="#888" stroke-width="2"/>
          <path d="M14 20 L35 20 M14 26 L35 26 M14 32 L35 32 M14 38 L28 38" stroke="#7aa7d8" stroke-width="2.5"/>`,
    jpg: `<rect x="4" y="7" width="40" height="34" rx="3" fill="#fff" stroke="#888" stroke-width="2"/>
          <circle cx="15" cy="17" r="4" fill="#ffc83d"/><path d="M7 38 L19 24 L27 32 L33 26 L42 38 Z" fill="#4caf50"/>`,
    paint: `<rect x="4" y="4" width="40" height="40" rx="8" fill="#fff" stroke="#999" stroke-width="2"/>
            <circle cx="16" cy="17" r="5" fill="#e5484d"/><circle cx="30" cy="15" r="5" fill="#3cb371"/><circle cx="33" cy="29" r="5" fill="#4a90e2"/>
            <path d="M10 38 L22 26 L25 29 L13 41 Z" fill="#8b5a2b"/>`,
    music: `<rect x="4" y="4" width="40" height="40" rx="8" fill="#ff7f50"/><path d="M20 34 L20 13 L35 10 L35 30" stroke="#fff" stroke-width="3" fill="none"/>
            <circle cx="16" cy="34" r="5" fill="#fff"/><circle cx="31" cy="31" r="5" fill="#fff"/>`,
    trophy: `<path d="M14 6 L34 6 L34 20 Q34 30 24 30 Q14 30 14 20 Z" fill="#ffc83d" stroke="#c99000" stroke-width="2"/>
             <path d="M14 10 Q5 10 7 18 Q9 23 14 22 M34 10 Q43 10 41 18 Q39 23 34 22" stroke="#c99000" stroke-width="2.5" fill="none"/>
             <rect x="21" y="30" width="6" height="7" fill="#c99000"/><rect x="14" y="37" width="20" height="6" rx="2" fill="#8b5a2b"/>`,
    hourglass: `<path d="M12 4 L36 4 M12 44 L36 44" stroke="#555" stroke-width="3"/><path d="M14 6 L34 6 Q34 18 24 24 Q34 30 34 42 L14 42 Q14 30 24 24 Q14 18 14 6 Z" fill="#d7e6f5" stroke="#555" stroke-width="2"/>
                <path d="M18 38 L30 38 L24 30 Z" fill="#e8a317"/>`,
    hand: `<path d="M18 44 L14 30 Q12 25 16 25 L19 30 L19 9 Q19 5 22 5 Q25 5 25 9 L25 22 Q27 19 30 21 L31 23 Q33 20 36 22 L37 24 Q40 22 42 26 L42 34 Q42 40 38 44 Z" fill="#fff" stroke="#333" stroke-width="2"/>`,
    arrow: `<path d="M12 4 L12 38 L20 30 L26 44 L31 42 L25 28 L36 28 Z" fill="#fff" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/>`,
    ibeam: `<path d="M17 6 Q24 6 24 11 Q24 6 31 6 M24 11 L24 37 M17 42 Q24 42 24 37 Q24 42 31 42" stroke="#333" stroke-width="3" fill="none"/>`,
    chrome: `<path d="M24 24 L6.68 14 A20 20 0 0 1 41.32 14 Z" fill="#ea4335"/><path d="M24 24 L41.32 14 A20 20 0 0 1 24 44 Z" fill="#fbbc04"/><path d="M24 24 L24 44 A20 20 0 0 1 6.68 14 Z" fill="#34a853"/><circle cx="24" cy="24" r="9.5" fill="#fff"/><circle cx="24" cy="24" r="7.5" fill="#4285f4"/>`,
    lock: `<rect x="10" y="20" width="28" height="22" rx="4" fill="#e8a317"/><path d="M16 20 L16 14 Q16 6 24 6 Q32 6 32 14 L32 20" stroke="#777" stroke-width="4" fill="none"/>`,
    power: `<circle cx="24" cy="24" r="20" fill="#e5484d"/><path d="M16 15 Q9 22 13 31 Q18 39 27 38 Q36 35 37 26 Q37 19 32 15" stroke="#fff" stroke-width="3.5" fill="none"/><path d="M24 9 L24 24" stroke="#fff" stroke-width="3.5"/>`,
    plug: `<rect x="14" y="14" width="20" height="20" rx="4" fill="#666"/><path d="M19 14 L19 5 M29 14 L29 5" stroke="#999" stroke-width="3"/><path d="M24 34 Q24 44 36 44" stroke="#333" stroke-width="3" fill="none"/>`,
    monitorBtn: `<rect x="3" y="6" width="42" height="28" rx="3" fill="#333"/><rect x="6" y="9" width="36" height="22" fill="#1f2937"/><circle cx="40" cy="38" r="4" fill="#3cb371"/><rect x="20" y="34" width="8" height="8" fill="#555"/>`,
    usb: `<rect x="16" y="4" width="16" height="12" fill="#bbb" stroke="#777" stroke-width="2"/><rect x="12" y="16" width="24" height="28" rx="4" fill="#4a90e2"/>`,
  };
  function icon(name, size) {
    const s = size || 48;
    return `<svg class="ico" viewBox="0 0 48 48" width="${s}" height="${s}" aria-hidden="true">${GLYPH[name] || ''}</svg>`;
  }
  // 把小圖示放到大圖的 (x, y)，邊長 s
  const place = (name, x, y, s) => `<g transform="translate(${x},${y}) scale(${s / 48})">${GLYPH[name]}</g>`;
  const svg = (vb, body, cls) => `<svg class="art ${cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const spot = (name, inner) => `<g class="spot" data-spot="${name}">${inner}</g>`;

  // ---------- 滑鼠 ----------
  // opts.hl：要塗色的部位（選項小圖用）；opts.mark：旁邊加的小字（例：「×2」）
  function mouse(opts) {
    opts = opts || {};
    const fill = part => (opts.hl === part ? '#ffcf3f' : (part === 'wheel' ? '#555' : '#f2f2f2'));
    return svg(opts.mark ? '-80 0 380 320' : '0 0 220 320', `
      <path d="M110 40 Q110 10 140 6" stroke="#666" stroke-width="5" fill="none"/>
      ${spot('body', `<path d="M32 146 L188 146 L188 222 Q188 300 110 300 Q32 300 32 222 Z" fill="${fill('body')}" stroke="#555" stroke-width="4"/>`)}
      ${spot('left', `<path d="M106 42 Q34 46 32 124 L32 142 L106 142 Z" fill="${fill('left')}" stroke="#555" stroke-width="4"/>`)}
      ${spot('right', `<path d="M114 42 Q186 46 188 124 L188 142 L114 142 Z" fill="${fill('right')}" stroke="#555" stroke-width="4"/>`)}
      ${spot('wheel', `<rect x="96" y="58" width="28" height="62" rx="14" fill="${fill('wheel')}" stroke="#333" stroke-width="3"/>
        <path d="M100 74 L120 74 M100 84 L120 84 M100 94 L120 94 M100 104 L120 104" stroke="${opts.hl === 'wheel' ? '#a77d00' : '#888'}" stroke-width="2"/>`)}
      ${opts.mark ? `<text x="${opts.hl === 'right' ? 250 : -30}" y="112" font-size="64" font-weight="bold" fill="#e5484d" text-anchor="middle">${opts.mark}</text>` : ''}
    `, 'mouse');
  }

  // ---------- Windows 11 桌面 ----------
  function desktop(opts) {
    opts = opts || {};
    const ime = opts.ime || '中';
    const deskIcon = (name, glyph, label, y) => spot(name, `
      <rect x="14" y="${y}" width="84" height="84" rx="6" fill="transparent"/>
      ${place(glyph, 32, y + 6, 48)}
      <text x="56" y="${y + 74}" font-size="15" fill="#fff" text-anchor="middle" style="paint-order:stroke" stroke="#0004" stroke-width="3">${label}</text>`);
    const tbIcon = (name, glyph, x) => spot(name, `<rect x="${x}" y="408" width="40" height="38" rx="6" fill="#ffffff00"/>${place(glyph, x + 5, 412, 30)}`);
    return svg('0 0 800 450', `
      <defs><linearGradient id="wp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e5bb8"/><stop offset="1" stop-color="#7ab8f5"/></linearGradient></defs>
      ${spot('wallpaper', `<rect width="800" height="402" fill="url(#wp)"/>
        <path d="M430 300 Q520 150 650 210 Q560 190 470 300 Z" fill="#ffffff22"/><path d="M460 320 Q560 210 700 250 Q590 240 500 320 Z" fill="#ffffff18"/>`)}
      ${deskIcon('pc', 'pc', '本機', 14)}
      ${deskIcon('recycle', 'recycle', '資源回收筒', 108)}
      ${deskIcon('folder', 'folder', '我的作業', 202)}
      ${spot('taskbar', `<rect y="402" width="800" height="48" fill="#eef1f6"/><path d="M0 402 L800 402" stroke="#cfd5de"/>`)}
      ${spot('start', `<rect x="290" y="408" width="40" height="38" rx="6" fill="#ffffff00"/>
        <rect x="299" y="416" width="10" height="10" fill="#0a72d8"/><rect x="311" y="416" width="10" height="10" fill="#0a72d8"/>
        <rect x="299" y="428" width="10" height="10" fill="#0a72d8"/><rect x="311" y="428" width="10" height="10" fill="#0a72d8"/>`)}
      ${spot('search', `<rect x="336" y="408" width="40" height="38" rx="6" fill="#ffffff00"/>
        <circle cx="353" cy="424" r="7" stroke="#333" stroke-width="2.5" fill="none"/><path d="M358 429 L365 436" stroke="#333" stroke-width="3"/>`)}
      ${tbIcon('explorer', 'folder', 382)}
      ${tbIcon('chrome', 'chrome', 428)}
      ${spot('wifi', `<rect x="600" y="410" width="30" height="34" rx="5" fill="#ffffff00"/>
        <path d="M604 422 Q615 412 626 422 M607 427 Q615 420 623 427 M610 432 Q615 428 620 432" stroke="#333" stroke-width="2.2" fill="none"/><circle cx="615" cy="437" r="2" fill="#333"/>`)}
      ${spot('volume', `<rect x="632" y="410" width="30" height="34" rx="5" fill="#ffffff00"/>
        <path d="M637 423 L642 423 L649 417 L649 437 L642 431 L637 431 Z" fill="#333"/><path d="M653 421 Q657 427 653 433" stroke="#333" stroke-width="2" fill="none"/>`)}
      ${spot('ime', `<rect x="666" y="412" width="32" height="30" rx="5" fill="#ffffff00"/>
        <text x="682" y="434" font-size="20" text-anchor="middle" fill="#222">${ime}</text>`)}
      ${spot('clock', `<rect x="704" y="408" width="90" height="38" rx="5" fill="#ffffff00"/>
        <text x="749" y="424" font-size="13" text-anchor="middle" fill="#222">上午 10:30</text>
        <text x="749" y="440" font-size="12" text-anchor="middle" fill="#222">2026/10/12</text>`)}
    `, 'desktop');
  }

  // ---------- 記事本視窗 ----------
  function windowArt() {
    return svg('0 0 800 450', `
      <rect width="800" height="450" fill="#cfe0f5"/>
      <rect x="60" y="30" width="680" height="390" rx="8" fill="#fff" stroke="#9aa5b5" stroke-width="2"/>
      ${spot('title', `<path d="M61 70 L61 38 Q61 31 68 31 L732 31 Q739 31 739 38 L739 70 Z" fill="#f3f3f3"/>
        ${place('txt', 76, 39, 24)}<text x="108" y="57" font-size="16" fill="#222">無標題 - 記事本</text>`)}
      ${spot('min', `<rect x="590" y="31" width="50" height="39" fill="#f3f3f3"/><path d="M607 51 L623 51" stroke="#222" stroke-width="2"/>`)}
      ${spot('max', `<rect x="640" y="31" width="50" height="39" fill="#f3f3f3"/><rect x="657" y="43" width="15" height="14" stroke="#222" stroke-width="2" fill="none"/>`)}
      ${spot('close', `<path d="M690 31 L732 31 Q739 31 739 38 L739 70 L690 70 Z" fill="#f3f3f3"/><path d="M707 43 L721 57 M721 43 L707 57" stroke="#222" stroke-width="2"/>`)}
      <rect x="61" y="70" width="678" height="34" fill="#fafafa"/><path d="M61 104 L739 104" stroke="#e3e3e3"/>
      ${spot('menu-file', `<rect x="70" y="74" width="50" height="26" rx="4" fill="#fafafa"/><text x="95" y="93" font-size="16" text-anchor="middle" fill="#222">檔案</text>`)}
      <text x="150" y="93" font-size="16" text-anchor="middle" fill="#222">編輯</text>
      <text x="205" y="93" font-size="16" text-anchor="middle" fill="#222">檢視</text>
      ${spot('content', `<rect x="62" y="105" width="676" height="313" fill="#fff"/>
        <text x="84" y="140" font-size="20" fill="#222">今天天氣很好，我和同學去操場跑步。</text>
        <path d="M410 122 L410 146" stroke="#222" stroke-width="2"/>`)}
    `, 'window');
  }

  // ---------- 檔案總管 ----------
  function explorer() {
    const item = (name, glyph, label, x, y) => spot(name, `
      <rect x="${x}" y="${y}" width="96" height="96" rx="6" fill="#ffffff00"/>
      ${place(glyph, x + 22, y + 8, 52)}
      <text x="${x + 48}" y="${y + 84}" font-size="15" text-anchor="middle" fill="#222">${label}</text>`);
    return svg('0 0 800 450', `
      <rect width="800" height="450" fill="#cfe0f5"/>
      <rect x="20" y="10" width="760" height="430" rx="8" fill="#fff" stroke="#9aa5b5" stroke-width="2"/>
      <path d="M21 50 L21 18 Q21 11 28 11 L772 11 Q779 11 779 18 L779 50 Z" fill="#eef1f6"/>
      ${place('folder', 34, 18, 24)}<text x="66" y="37" font-size="15" fill="#222">文件</text>
      <path d="M647 31 L661 31" stroke="#222" stroke-width="2"/><rect x="688" y="24" width="13" height="13" stroke="#222" stroke-width="2" fill="none"/>
      ${spot('close', `<path d="M730 11 L772 11 Q779 11 779 18 L779 50 L730 50 Z" fill="#eef1f6"/><path d="M748 24 L760 36 M760 24 L748 36" stroke="#222" stroke-width="2"/>`)}
      <rect x="21" y="50" width="758" height="44" fill="#f9fafb"/>
      ${spot('back', `<rect x="28" y="56" width="34" height="32" rx="5" fill="#f9fafb"/><path d="M54 72 L36 72 M44 63 L35 72 L44 81" stroke="#222" stroke-width="2.5" fill="none"/>`)}
      <path d="M72 72 L90 72 M82 63 L91 72 L82 81" stroke="#bbb" stroke-width="2.5" fill="none"/>
      ${spot('up', `<rect x="100" y="56" width="34" height="32" rx="5" fill="#f9fafb"/><path d="M117 82 L117 63 M108 71 L117 62 L126 71" stroke="#222" stroke-width="2.5" fill="none"/>`)}
      ${spot('address', `<rect x="146" y="58" width="420" height="28" rx="5" fill="#fff" stroke="#c6ccd5"/>
        ${place('pc', 154, 62, 20)}<text x="182" y="78" font-size="15" fill="#222">本機  ›  文件</text>`)}
      ${spot('search', `<rect x="578" y="58" width="192" height="28" rx="5" fill="#fff" stroke="#c6ccd5"/>
        <circle cx="595" cy="71" r="6" stroke="#666" stroke-width="2" fill="none"/><path d="M599 75 L604 80" stroke="#666" stroke-width="2"/>
        <text x="612" y="77" font-size="14" fill="#888">搜尋 文件</text>`)}
      <rect x="21" y="94" width="758" height="44" fill="#fff"/><path d="M21 138 L779 138" stroke="#e3e3e3"/>
      ${spot('new', `<rect x="30" y="100" width="86" height="32" rx="5" fill="#fff" stroke="#e3e3e3"/>
        <text x="46" y="123" font-size="22" fill="#0a72d8">＋</text><text x="94" y="122" font-size="15" text-anchor="middle" fill="#222">新增</text>`)}
      <text x="150" y="123" font-size="18" fill="#555">✂</text><text x="185" y="123" font-size="18" fill="#555">⧉</text>
      <text x="220" y="123" font-size="18" fill="#555">📋</text><text x="258" y="123" font-size="18" fill="#555">🗑</text>
      ${spot('navpane', `<rect x="21" y="139" width="170" height="300" fill="#f6f8fb"/>
        <text x="44" y="170" font-size="15" fill="#222">🏠 首頁</text><text x="44" y="204" font-size="15" fill="#222">🖥 桌面</text>
        <text x="44" y="238" font-size="15" fill="#222">⬇ 下載</text>
        <rect x="30" y="252" width="150" height="28" rx="4" fill="#dce9f9"/><text x="44" y="272" font-size="15" fill="#222">📄 文件</text>
        <text x="44" y="306" font-size="15" fill="#222">🖼 圖片</text><text x="44" y="340" font-size="15" fill="#222">🎵 音樂</text>`)}
      ${item('folder', 'folder', '作業', 220, 156)}
      ${item('folder', 'folder', '比賽照片', 330, 156)}
      ${item('folder', 'folder', '音樂課', 440, 156)}
      ${item('file', 'txt', '日記.txt', 220, 270)}
      ${item('file', 'jpg', '小狗.jpg', 330, 270)}
    `, 'explorer');
  }

  const BUILDERS = { mouse, desktop, window: windowArt, explorer };
  // 題庫裡寫 art: 'mouse' 或 art: { name: 'desktop', ime: '英' }
  function build(spec) {
    if (!spec) return '';
    if (typeof spec === 'string') spec = { name: spec };
    if (spec.icon) return `<div class="big-icon">${icon(spec.icon, 120)}</div>`;
    // art: { pair: ['jpg', 'folder'] } → 兩個圖示中間一個箭頭（例：圖片 ➜ 資料夾）
    if (spec.pair) return `<div class="big-icon pair">${icon(spec.pair[0], 100)}<span class="pair-arrow">➜</span>${icon(spec.pair[1], 120)}</div>`;
    const fn = BUILDERS[spec.name];
    return fn ? fn(spec) : '';
  }

  return { icon, build, mouse, desktop, window: windowArt, explorer, GLYPH };
})();
