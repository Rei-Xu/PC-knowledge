/* 電腦小勇士 — 示範動畫（像 GIF 一樣自動輪播的迷你記事本）
 *
 * 題庫裡寫 demo: [ 一格, 一格, ... ]，每一格可以有：
 *   t      記事本裡的文字。特殊符號：| 閃爍游標　\n 換行　[字] 反白選取　{字} 紅色（打錯的字）　_ 看得見的空格
 *   key    右邊「按鍵」徽章，寫成陣列，例如 ['？'] 或 ['Ctrl', '？']（答案鍵請寫 ？，不要洩漏答案）
 *   ime    記事本右下角的「中」或「英」
 *   caps   true＝Caps Lock 燈亮
 *   title  記事本標題（預設「作文」）
 *   toast  畫面下方跳出的小提示，例如「📋 已複製」
 *   pad    true＝顯示符號小鍵盤；padHit: '《' 表示正在點小鍵盤上的這個符號
 *   ms     這一格停多久（毫秒，預設 1100；最後一格預設 2000）
 */
window.DEMO = (function () {
  'use strict';
  const PAD = ['，', '。', '、', '；', '：', '？', '！', '「', '」', '《', '》', '（', '）', '…', '—', '～'];

  function esc(ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]) || ch; }
  // 把 t 的特殊符號轉成畫面
  function textHtml(t) {
    let out = '';
    for (const ch of t || '') {
      if (ch === '|') out += '<span class="d-cur"></span>';
      else if (ch === '\n') out += '<br>';
      else if (ch === '[') out += '<span class="d-sel">';
      else if (ch === '{') out += '<span class="d-red">';
      else if (ch === ']' || ch === '}') out += '</span>';
      else if (ch === '_') out += '<span class="d-sp"> </span>';
      else out += esc(ch);
    }
    return out;
  }

  function play(container, frames) {
    container.innerHTML = `<div class="demo">
      <div class="demo-label">▶ 看示範</div>
      <div class="demo-row">
        <div class="d-pad-wrap">
          <div class="d-note">
            <div class="d-title"></div>
            <div class="d-body"></div>
            <div class="d-status"><span class="d-caps">Caps Lock <i></i></span><span class="d-ime"></span></div>
          </div>
          <div class="d-symbols hidden">${PAD.map(s => `<span data-s="${s}">${s}</span>`).join('')}</div>
          <div class="d-toast hidden"></div>
        </div>
        <div class="d-keys"><div class="d-kicon">⌨️</div><div class="d-kcaps"></div></div>
      </div></div>`;
    const $ = sel => container.querySelector(sel);
    let i = 0, timer = null;
    function show() {
      const f = frames[i];
      $('.d-title').textContent = `📝 ${f.title || '作文'} - 記事本`;
      $('.d-body').innerHTML = textHtml(f.t);
      $('.d-ime').textContent = f.ime || '';
      $('.d-ime').classList.toggle('hidden', !f.ime);
      $('.d-caps').classList.toggle('hidden', f.caps == null);
      $('.d-caps').classList.toggle('on', !!f.caps);
      const pad = $('.d-symbols');
      pad.classList.toggle('hidden', !f.pad);
      pad.querySelectorAll('span').forEach(s => s.classList.toggle('hit', s.dataset.s === f.padHit));
      const toast = $('.d-toast');
      toast.textContent = f.toast || '';
      toast.classList.toggle('hidden', !f.toast);
      const keys = $('.d-kcaps');
      keys.innerHTML = f.key ? f.key.map(k => `<span class="d-kc">${esc(k)}</span>`).join('<b>＋</b>') : '';
      $('.d-keys').classList.toggle('active', !!f.key);
      const last = i === frames.length - 1;
      timer = setTimeout(() => { i = last ? 0 : i + 1; show(); }, f.ms || (last ? 2000 : 1100));
    }
    show();
    return () => clearTimeout(timer);
  }

  return { play };
})();
