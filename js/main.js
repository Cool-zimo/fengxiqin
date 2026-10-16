/* ============================================================
   冯希钦 · 生辰吉乐
   ============================================================ */
'use strict';

/* ┌─────────────────────────────────────────────────────────┐
   │  她的生日 —— 填这里即可（公历）                          │
   │  month: 1~12    day: 1~31                                │
   │  留 0 则不显示倒数那一栏，其余功能不受影响。             │
   └─────────────────────────────────────────────────────────┘ */
const BIRTHDAY = { month: 0, day: 0 };

const REDUCED = !!(window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const $ = s => document.querySelector(s);

/* ============================================================
   1. 飘落的梅瓣
   ============================================================ */
function makePetals() {
  if (REDUCED) return;
  const box = document.getElementById('petals');
  const n = window.innerWidth < 480 ? 9 : 14;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    // 随机化：起点、时长、延迟、大小、透明度 —— 不随机就会看出是复制的
    const dur = 12 + Math.random() * 12;
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = (-Math.random() * dur) + 's';
    const s = 6 + Math.random() * 7;
    p.style.width = s + 'px';
    p.style.height = s + 'px';
    p.style.opacity = (0.34 + Math.random() * 0.36).toFixed(2);
    box.appendChild(p);
  }
}

/* ============================================================
   2. 生日倒数
   ============================================================ */
function daysUntilBirthday() {
  if (!BIRTHDAY.month || !BIRTHDAY.day) return null;
  const now = new Date();
  // 统一归零到当天 0 点，否则"今天生日"会因为时辰被算成 0 天又跳到 365
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nb = new Date(today.getFullYear(), BIRTHDAY.month - 1, BIRTHDAY.day);
  if (nb.getTime() < today.getTime()) {
    nb = new Date(today.getFullYear() + 1, BIRTHDAY.month - 1, BIRTHDAY.day);
  }
  // 2 月 29 日这类日期会被 Date 自动进位到 3/1，这里不特殊处理，
  // 因为 month/day 是手填的常量，填 2/29 时非闰年落到 3/1 是可接受的。
  return Math.round((nb - today) / 86400000);
}

function initCountdown() {
  const d = daysUntilBirthday();
  if (d === null) return;              // 没配置就整栏不出现
  const sec = document.getElementById('count');
  const num = document.getElementById('cdNum');
  const cap = sec.querySelector('.cd-cap');
  sec.hidden = false;
  num.classList.add('gold-text');
  num.textContent = d;
  if (d === 0) {
    cap.textContent = '正是今朝 · 生辰吉乐';
    num.textContent = '今';
  }
}

/* ============================================================
   3. 焰火画布
   ============================================================ */
const FX = (() => {
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let parts = [], raf = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = Math.floor(window.innerWidth * dpr);
    H = cv.height = Math.floor(window.innerHeight * dpr);
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const GOLDS = ['#ffe9a8', '#ffd76a', '#f5c344', '#e8b84b', '#fff6d8'];
  const REDS  = ['#d9553f', '#c1402f'];

  function launch(x, y, count) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.25;
      const sp = (1.9 + Math.random() * 3.4) * dpr;
      const gold = Math.random() > 0.14;
      parts.push({
        x: x * dpr, y: y * dpr,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.009 + Math.random() * 0.011,
        r: (1.1 + Math.random() * 2.0) * dpr,
        c: gold ? GOLDS[(Math.random() * GOLDS.length) | 0]
                : REDS[(Math.random() * REDS.length) | 0]
      });
    }
  }

  function tick() {
    // ★ 透明拖尾的关键：不能用半透明黑覆盖（会把宣纸底涂黑），
    //   要用 destination-out 擦掉一层 alpha，底下的页面才透得出来。
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += 0.032 * dpr;      // 重力
      p.vx *= 0.985;            // 空气阻力
      p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (parts.length) {
      raf = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, W, H);
      raf = null;
    }
  }

  return {
    celebrate(cx, cy) {
      if (REDUCED) return;      // 降低动效偏好下不放烟花
      launch(cx, cy, 46);
      // 错开两波，比一次炸完更像真的焰火
      setTimeout(() => launch(cx + 90, cy - 60, 34), 190);
      setTimeout(() => launch(cx - 90, cy - 30, 34), 380);
      if (!raf) raf = requestAnimationFrame(tick);
    }
  };
})();

/* ============================================================
   4. 吹蜡烛
   ============================================================ */
function initCandle() {
  const stage = document.getElementById('candleStage');
  const flame = document.getElementById('flame');
  const smoke = document.getElementById('smoke');
  const tip   = document.getElementById('candleTip');
  const again = document.getElementById('relight');
  let out = false, blowArmed = true;

  function blowOut() {
    if (out || !blowArmed) return;
    out = true;
    flame.classList.add('out');
    stage.classList.add('lit-out');
    smoke.classList.remove('on');
    void smoke.offsetWidth;          // 强制重排，让动画能重复触发
    smoke.classList.add('on');

    const r = stage.getBoundingClientRect();
    FX.celebrate(r.left + r.width / 2, r.top + r.height * 0.22);

    tip.textContent = '愿这一岁的愿望，都作数。';
    again.hidden = false;
    // 吹过一次就不再监听吹气，免得说话也把"再点一次"的烛火吹灭
    blowArmed = false;
  }

  function relight() {
    out = false;
    flame.classList.remove('out');
    stage.classList.remove('lit-out');
    smoke.classList.remove('on');
    tip.textContent = '轻触烛火 · 或对屏幕吹一口气';
    again.hidden = true;
    blowArmed = true;
  }

  stage.addEventListener('click', blowOut);
  stage.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blowOut(); }
  });
  again.addEventListener('click', e => { e.stopPropagation(); relight(); });

  /* --- 吹气检测 ---
     只在用户第一次交互之后才要麦克风：
     ① AudioContext 受自动播放策略限制，没有手势起不来
     ② 一进页面就弹权限框会很吓人 */
  let micStarted = false;
  function armMic() {
    if (micStarted || REDUCED) return;
    micStarted = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (location.protocol !== 'https:') return;   // 非安全上下文拿不到麦克风

    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(stream => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      let hits = 0;

      (function loop() {
        requestAnimationFrame(loop);
        an.getByteFrequencyData(buf);
        // 吹气是低频宽带噪声，取前 24 个 bin 的平均能量
        let sum = 0;
        for (let i = 0; i < 24; i++) sum += buf[i];
        const avg = sum / 24;
        if (avg > 148) hits++;
        else hits = Math.max(0, hits - 2);
        // 连续若干帧才算数，避免一声咳嗽误触
        if (hits > 5) { hits = 0; blowOut(); }
      })();
    }).catch(() => {
      /* 拒绝授权 / 没有麦克风 / 被其它应用占用：
         静默降级，点击照常能吹。这里绝不能弹报错，
         否则在别人手机上会跳出一段吓人的英文。 */
    });
  }

  stage.addEventListener('pointerdown', armMic, { once: true });
  stage.addEventListener('focus', armMic, { once: true });
}

/* ============================================================
   5. 锦盒
   ============================================================ */
function initGift() {
  const stage  = document.getElementById('giftStage');
  const burst  = document.getElementById('burst');
  const scroll = document.getElementById('scroll');
  const tip    = document.getElementById('giftTip');
  let opened = false;

  stage.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    stage.classList.add('shake');
    burst.classList.add('on');

    // 晃动 0.5s 之后再开卷轴，中间留一点"要开了"的悬念
    setTimeout(() => {
      stage.classList.add('opened');
      scroll.classList.add('open');
      scroll.setAttribute('aria-hidden', 'false');
      tip.textContent = '—— 这是给你的。';
    }, 480);
  });

  stage.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stage.click(); }
  });
}

/* ============================================================
   6. 祝福墙
   ============================================================ */
const STORE_KEY = 'fxq-wishes-v1';

/* localStorage 在隐私模式 / file:// 下可能直接抛异常，
   不包起来的话整段脚本会在这里断掉，后面全不执行。 */
function loadWishes() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveWishes(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
  catch (e) { return false; }
}

function initWall() {
  const form  = document.getElementById('wform');
  const nameI = document.getElementById('wname');
  const textI = document.getElementById('wtext');
  const box   = document.getElementById('notes');
  const empty = document.getElementById('wallEmpty');
  const exBtn = document.getElementById('exportBtn');
  let wishes = loadWishes();

  function render() {
    box.innerHTML = '';
    wishes.forEach((w, i) => {
      const n = document.createElement('div');
      n.className = 'note';
      // 每张笺歪一点点，但不随机到夸张；用索引保证同一个人刷新后角度一致
      const tilt = ((i % 5) - 2) * 0.9;
      n.style.transform = 'rotate(' + tilt + 'deg)';
      n.style.animationDelay = Math.min(i * 0.06, 0.6) + 's';

      const p = document.createElement('p');
      p.className = 'n-text';
      p.textContent = w.text;           // textContent：用户输入绝不进 innerHTML

      const b = document.createElement('p');
      b.className = 'n-name';
      b.textContent = '—— ' + w.name;

      n.appendChild(p); n.appendChild(b);
      box.appendChild(n);
    });
    empty.hidden = wishes.length > 0;
    exBtn.hidden = wishes.length === 0;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameI.value.trim() || '匿名';
    const text = textI.value.trim();
    if (!text) { textI.focus(); return; }
    wishes.push({ name: name, text: text, t: Date.now() });
    const ok = saveWishes(wishes);
    render();
    textI.value = '';
    if (!ok) {
      // 存不下也要让人看见自己刚写的东西，不能写完就没了
      empty.hidden = true;
      empty.textContent = '（这条只在本页显示：当前浏览器不允许保存）';
      empty.hidden = false;
    }
  });

  exBtn.addEventListener('click', () => {
    const txt = wishes.map(w => w.name + '：' + w.text).join('\n\n');
    const head = '致 冯希钦 —— 生辰祝福\n' + '='.repeat(24) + '\n\n';
    const blob = new Blob([head + txt + '\n'], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '冯希钦-生日祝福.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  render();
}

/* ============================================================
   启动
   ============================================================ */
makePetals();
initCountdown();
initCandle();
initGift();
initWall();
