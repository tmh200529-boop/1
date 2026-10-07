// 画面: 所有内容都是 t 的纯函数。
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev, lines } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H;
  const FAM = '"WenQuanYi Zen Hei", "Noto Sans CJK SC", sans-serif';
  const txt = (ctx, s, x, y, o) => G.text(ctx, s, x, y, Object.assign({ fam: FAM, weight: 400 }, o));
  const SCR = { x: 90, y: 250, w: 900, h: 480 };
  const HIP = 1190, CS = 1.0, NX = 340, MX = 630;

  const styleM = { skin: '#F2D3B8', hair: '#15131A', hairStyle: 'short', outfit: 'tee', shirt: '#6C7A89', build: 'slim', sleeves: 'short' };
  const styleN = { skin: '#F8E0CE', hair: '#7A1020', hairStyle: 'long', outfit: 'shirt', shirt: '#1B1D26', collar: '#C8283C', build: 'slim' };

  const active = (t) => lines.find((l) => t >= l.t && t < l.end);
  const talk = (t, who) => { const l = active(t); return l && l.who === who ? { open: 0.5 + 0.5 * Math.sin(t * 17), wide: 0.4, talking: true } : null; };
  const tagNow = (t) => { const l = active(t); return l ? l.tag : ''; };
  const has = (t, p) => tagNow(t).startsWith(p);

  // ---------- 背景: 影厅 ----------
  function hall(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120A14'); g.addColorStop(0.5, '#2A0F1E'); g.addColorStop(1, '#0A0508');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 侧幕
    for (const sx of [0, W - 70]) { for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#5A1020' : '#430A18'; ctx.fillRect(sx + i * 10, 0, 10, H * 0.62); } }
    // 银幕光
    const L = 0.55 + 0.1 * Math.sin(t * 3.1);
    const gl = ctx.createRadialGradient(W / 2, SCR.y + SCR.h / 2, 60, W / 2, SCR.y + SCR.h / 2, 900);
    gl.addColorStop(0, `rgba(255,190,120,${0.40 * L})`); gl.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
  }

  // ---------- 银幕内容 ----------
  function walle(ctx, t, x, y, k, awake, hold) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    // 履带
    G.rrect(ctx, -70, 30, 140, 44, 20, { fill: '#3A3631' });
    G.rrect(ctx, -62, -50, 124, 90, 8, { fill: '#D9A441' });
    for (let i = 0; i < 4; i++) G.rect ? 0 : 0;
    G.rrect(ctx, -22, -78, 44, 34, 6, { fill: '#B98A33' });
    // 双眼
    const up = awake ? 1 : 0.15;
    for (const ex of [-30, 30]) { G.rrect(ctx, ex - 22, -122 - 18 * up, 44, 52, 10, { fill: '#7F8A8C' }); ctx.fillStyle = awake ? '#9EE8FF' : '#2A3438'; ctx.beginPath(); ctx.arc(ex, -100 - 18 * up, 14, 0, 7); ctx.fill(); }
    // 手臂
    const ax = hold ? 110 : 80, ay = hold ? -20 : 10;
    G.line(ctx, [[62, -10], [ax, ay]], { color: '#6A6E70', lw: 14 });
    ctx.restore();
  }
  function eve(ctx, t, x, y, k) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 2) * 8); ctx.scale(k, k);
    G.ellipse(ctx, 0, 0, 44, 66, { fill: '#F4F6F8' }); G.ellipse(ctx, 0, -28, 30, 22, { fill: '#10151C' });
    ctx.fillStyle = '#6FD8FF'; for (const ex of [-12, 12]) { ctx.beginPath(); ctx.ellipse(ex, -28, 8, 5, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function filmWorld(ctx, t) {
    const g = ctx.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h); g.addColorStop(0, '#F0A25C'); g.addColorStop(1, '#8A4B2E');
    ctx.fillStyle = g; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    ctx.fillStyle = '#5B3524'; ctx.beginPath(); ctx.moveTo(SCR.x, SCR.y + 400);
    for (let i = 0; i <= 9; i++) ctx.lineTo(SCR.x + i * 100, SCR.y + 360 + (i % 3) * 30 + (i % 2) * 20); ctx.lineTo(SCR.x + SCR.w, SCR.y + SCR.h); ctx.lineTo(SCR.x, SCR.y + SCR.h); ctx.fill();
    ctx.fillStyle = '#3F2518'; ctx.fillRect(SCR.x, SCR.y + 430, SCR.w, 60);
    const awake = t > ev.wake - 0.3, wk = clamp((t - (ev.wake - 0.3)) / 0.4);
    const holdT = ev.cd0 + 5.2;
    const hold = t > holdT;
    const wx = hold ? 450 : 330, ex = hold ? 560 : 640 + Math.sin(t) * 10;
    walle(ctx, t, SCR.x + wx, SCR.y + 390, 1.05, awake && wk > 0.3, hold);
    if (awake) eve(ctx, t, SCR.x + ex, SCR.y + 250, 1.0);
    if (hold) { ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.beginPath(); ctx.arc(SCR.x + 505, SCR.y + 372, 18 + 6 * Math.sin(t * 6), 0, 7); ctx.fill(); }
  }
  function panelBg(ctx, c0, c1) { const g = ctx.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); }
  function clueIcon(ctx, kind, cx, cy, p) {
    ctx.save(); ctx.translate(cx, cy); const k = ease.outBack(clamp(p / 0.3), 2.5) * 1.5; ctx.scale(k, k);
    if (kind === 'shirt') { G.poly(ctx, [[-70, -50], [-30, -62], [0, -44], [30, -62], [70, -50], [90, -10], [60, -2], [52, 66], [-52, 66], [-60, -2], [-90, -10]], { fill: '#E8E8F0' }); txt(ctx, 'M', 0, 14, { size: 46, color: '#C33', align: 'center', fam: 'Inter', weight: 800 }); }
    if (kind === 'reel') { G.ellipse(ctx, 0, 0, 70, 70, { fill: '#2B2B35' }); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + p * 3; G.ellipse(ctx, Math.cos(a) * 38, Math.sin(a) * 38, 14, 14, { fill: '#D6D6E4' }); } G.ellipse(ctx, 0, 0, 10, 10, { fill: '#D6D6E4' }); txt(ctx, '后半', 0, 108, { size: 34, color: '#fff', align: 'center' }); }
    if (kind === 'rocket') { G.rrect(ctx, -100, -22, 200, 44, 12, { fill: '#5C6B4F' }); G.rrect(ctx, 60, -34, 54, 68, 12, { fill: '#3E4A35' }); G.poly(ctx, [[-100, -16], [-140, 0], [-100, 16]], { fill: '#C94A2A' }); G.rrect(ctx, -30, 18, 22, 52, 6, { fill: '#2C3326' }); }
    if (kind === 'tire') { G.ellipse(ctx, 0, 0, 78, 78, { fill: '#1B1B20' }); G.ellipse(ctx, 0, 0, 40, 40, { fill: '#8B8F99' }); G.line(ctx, [[-60, -30], [-20, 10], [-40, 40]], { color: '#FF5A4D', lw: 6 }); }
    if (kind === 'clock') { G.ellipse(ctx, 0, 0, 74, 74, { fill: '#F2EBDD' }); ctx.strokeStyle = '#222'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -48); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(p * 8 - 1.2) * 34, Math.sin(p * 8 - 1.2) * 34); ctx.stroke(); }
    ctx.restore();
  }
  const CLUE_LABEL = { shirt: '线索·衣服的号码', reel: '线索·直接拿下的拷贝', rocket: '线索·火箭筒', tire: '线索·没爆的轮胎', clock: '线索·卡着表走' };

  function screenContent(ctx, t) {
    ctx.save(); ctx.beginPath(); ctx.rect(SCR.x, SCR.y, SCR.w, SCR.h); ctx.clip();
    const clue = ev.clues.find((c) => t >= c.t && t < c.end + 0.05);
    if (false) { skyline(ctx, t); }
    else if (clue) { panelBg(ctx, '#1A2038', '#0B0E1C'); const p = t - clue.t; clueIcon(ctx, clue.kind, SCR.x + SCR.w / 2, SCR.y + 210, p); txt(ctx, CLUE_LABEL[clue.kind], SCR.x + SCR.w / 2, SCR.y + 420, { size: 40, color: '#FFD479', align: 'center' }); }
    else if (t >= ev.loop && t < ev.loop + 7.8) {
      panelBg(ctx, '#201433', '#0C0818'); const p = clamp((t - ev.loop) / 7.8);
      for (let i = 0; i < 15; i++) { const cx = SCR.x + 90 + (i % 5) * 180, cy = SCR.y + 100 + Math.floor(i / 5) * 120; const a = (t * 3 + i) % 6.28; G.ellipse(ctx, cx, cy, 36, 36, { fill: 'rgba(200,190,255,0.25)' }); ctx.strokeStyle = 'rgba(230,225,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); ctx.stroke(); }
      const n = p > 0.92 ? '？' : String(1 + Math.floor(p * p * 130));
      txt(ctx, '第 ' + n + ' 次', SCR.x + SCR.w / 2, SCR.y + 450, { size: 64, color: '#CFC3FF', align: 'center' });
      txt(ctx, '共同的梦境', SCR.x + SCR.w / 2, SCR.y + 70, { size: 34, color: '#8C80C9', align: 'center' });
    } else if (t >= ev.maze && t < ev.regret) {
      if (t < lines.find((l) => l.tag === 'maze' && l.text.includes('老爹')).t) { maze(ctx, t); } else { panelBg(ctx, '#0A0D1A', '#050610'); night(ctx, t, true); }
    } else if (t >= ev.regret && t < ev.cd0) { night(ctx, t, false); }
    else if (t >= ev.love && t < ev.maze) { filmWorld(ctx, t); petals(ctx, t); }
    else { filmWorld(ctx, t); }
    ctx.restore();
    // 银幕边框
    ctx.strokeStyle = '#0A0508'; ctx.lineWidth = 14; ctx.strokeRect(SCR.x - 7, SCR.y - 7, SCR.w + 14, SCR.h + 14);
  }
  function petals(ctx, t) { for (let i = 0; i < 26; i++) { const r = U.hash(i, 3); const x = SCR.x + r * SCR.w, y = SCR.y + ((t * 40 + U.hash(i, 4) * 600) % 560) - 40; ctx.fillStyle = 'rgba(255,150,190,0.8)'; ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 2 + i) * 20, y, 8, 12, i, 0, 7); ctx.fill(); } ctx.fillStyle = 'rgba(255,120,170,0.12)'; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); }
  function maze(ctx, t) {
    panelBg(ctx, '#0D1B1F', '#050B0D'); const rng = U.mulberry32(7); ctx.strokeStyle = 'rgba(90,255,220,0.55)'; ctx.lineWidth = 5;
    const cx = SCR.x + 60, cy = SCR.y + 40, c = 60; const n = Math.floor(clamp((t - ev.maze) / 7.5) * 90) + 6;
    for (let i = 0; i < n; i++) { const gx = Math.floor(rng() * 14), gy = Math.floor(rng() * 7); ctx.beginPath(); if (rng() > 0.5) { ctx.moveTo(cx + gx * c, cy + gy * c); ctx.lineTo(cx + (gx + 1) * c, cy + gy * c); } else { ctx.moveTo(cx + gx * c, cy + gy * c); ctx.lineTo(cx + gx * c, cy + (gy + 1) * c); } ctx.stroke(); }
    txt(ctx, '尼伯龙根', SCR.x + SCR.w / 2, SCR.y + 455, { size: 56, color: '#7DFFE4', align: 'center' });
  }
  function night(ctx, t, car) {
    panelBg(ctx, '#0B1230', '#05060F'); ctx.fillStyle = '#12182E'; ctx.fillRect(SCR.x, SCR.y + 360, SCR.w, 120);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(SCR.x + U.hash(i, 1) * SCR.w, SCR.y + U.hash(i, 2) * 300, 3, 3); }
    const x = SCR.x + ((car ? t * 140 : t * 40) % (SCR.w + 400)) - 200;
    G.rrect(ctx, x, SCR.y + 330, 220, 56, 18, { fill: '#B8BCC8' }); G.rrect(ctx, x + 50, SCR.y + 290, 110, 46, 14, { fill: '#9AA0B0' });
    ctx.fillStyle = 'rgba(255,240,170,0.35)'; ctx.beginPath(); ctx.moveTo(x + 220, SCR.y + 350); ctx.lineTo(x + 520, SCR.y + 300); ctx.lineTo(x + 520, SCR.y + 420); ctx.fill();
    txt(ctx, '十五岁的那个夜晚', SCR.x + SCR.w / 2, SCR.y + 90, { size: 44, color: '#AEB9E8', align: 'center' });
  }
  function skyline(ctx, t) {
    panelBg(ctx, '#161233', '#3B1F4A'); const rng = U.mulberry32(11); ctx.fillStyle = '#0B0818';
    for (let i = 0; i < 14; i++) { const bw = 50 + rng() * 40, bh = 160 + rng() * 240; ctx.fillRect(SCR.x + i * 66, SCR.y + SCR.h - bh, bw, bh); }
    txt(ctx, '奥丁掷出——冈格尼尔·必中之枪', SCR.x + 20, SCR.y + 50, { size: 32, color: '#C79BFF' });
    // 枪的弧线
    const p = clamp((t - ev.cd0) / 5.2); const px = SCR.x + lerp(-40, SCR.w + 40, p), py = SCR.y + 380 - Math.sin(p * Math.PI) * 330;
    ctx.strokeStyle = 'rgba(160,60,220,0.5)'; ctx.lineWidth = 8; ctx.beginPath(); for (let q = 0; q <= p; q += 0.02) { const x = SCR.x + lerp(-40, SCR.w + 40, q), y = SCR.y + 380 - Math.sin(q * Math.PI) * 330; q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    { const ang = Math.atan2(-Math.cos(p * Math.PI) * 330 * Math.PI / (SCR.w + 80), 1);
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.shadowColor = '#B050FF'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#C9A24A'; ctx.fillRect(-120, -4, 120, 8); ctx.fillStyle = '#1A0030'; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(0, -14); ctx.lineTo(0, 14); ctx.fill();
      ctx.fillStyle = '#FFD9FF'; for (let i = 0; i < 5; i++) ctx.fillRect(-100 + i * 18, -2, 8, 4); ctx.restore(); }
  }

  // ---------- 人物 ----------
  function seats(ctx) {
    for (const x of [NX, MX]) { G.rrect(ctx, x - 170, HIP - 330, 340, 460, 60, { fill: '#6E1428' }); G.rrect(ctx, x - 150, HIP - 310, 300, 300, 50, { fill: '#7E1B33' }); }
  }
  function pistol(ctx, x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); G.rrect(ctx, -10, -14, 96, 28, 6, { fill: '#2B2D33' }); G.rrect(ctx, -6, 8, 26, 50, 6, { fill: '#1E2025' }); ctx.restore();
  }
  function people(ctx, t) {
    const gun = (has(t, 'gun') || (t >= ev.clues[0].t && t < ev.loop + 7.8) ? 1 : 0) && t < ev.gunLower;
    const lowered = t >= ev.gunLower;
    const lookAt = t >= ev.regret ? 0 : 0;
    const popBite = t > ev.cd0 + 9.8;
    // 诺诺 (左)
    const nHand = gun ? [150, -262] : lowered ? [60, -60] : [40, -120];
    Ch.person(ctx, { x: NX, y: HIP, pose: 'sit', s: CS, style: styleN, eyes: t > ev.cd0 ? 'wide' : 'normal', brows: gun ? 'determined' : 'neutral', mouth: talk(t, 'N') || (t > ev.pop ? 'smirk' : 'flat'), look: 0.8, handR: nHand, headRot: gun ? 0.05 : 0, blush: has(t, 'love') ? 0.6 : 0 });
    // 银色四叶草耳坠 (摇晃发光)
    for (const ex of [-75, 75]) { const sw = Math.sin(t * 4 + ex) * 4; const px = NX + ex * CS + sw, py = HIP - 214 * CS;
      ctx.fillStyle = '#E8EEF8'; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.arc(px + Math.cos(a) * 6, py + Math.sin(a) * 6, 6, 0, 7); ctx.fill(); }
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 6)})`; ctx.fillRect(px - 1, py - 14, 2, 28); ctx.fillRect(px - 14, py - 1, 28, 2); }
    if (gun) pistol(ctx, NX + 150 * CS, HIP - 262 * CS, -0.02);
    // 路明非 (右): 黑发、眼角下垂、没睡醒的衰样
    const checkWatch = t >= ev.watch && t < ev.watch + 1.8;
    const mouthM = talk(t, 'M') || 'flat';
    Ch.person(ctx, { x: MX, y: HIP, pose: 'sit', s: CS, style: styleM, eyes: 'normal', brows: has(t, 'regret') ? 'worried' : 'neutral', mouth: mouthM, look: -0.8, handL: checkWatch ? [-60, -230] : undefined, sweat: gun && t < ev.gunLower ? 1 : 0, blush: has(t, 'love') ? 0.7 : 0, headRot: -0.04 });
    if (checkWatch) { ctx.fillStyle = '#C0C6D0'; ctx.beginPath(); ctx.arc(MX - 60 * CS, HIP - 230 * CS, 12, 0, 7); ctx.fill(); }
    // 爆米花桶 (两人之间)
    G.poly(ctx, [[455, HIP - 60], [515, HIP - 60], [505, HIP + 70], [465, HIP + 70]], { fill: '#E23A3A' });
    for (let i = 0; i < 7; i++) { ctx.fillStyle = '#FFF4C8'; ctx.beginPath(); ctx.arc(463 + i * 8, HIP - 66 - (i % 2) * 8, 11, 0, 7); ctx.fill(); }
  }
  function frontSeats(ctx) { ctx.fillStyle = '#0B0408'; ctx.beginPath(); ctx.moveTo(0, HIP + 130); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, HIP + 130 - (x % 120 ? 0 : 30) + Math.sin(x) * 2); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill(); }

  // ---------- 腕表与倒计时 ----------
  function digital(ctx, t) {
    if (t < ev.watch - 0.2) return;
    const secs = S.clockSecs(t); const s0 = 23 * 3600 + 55 * 60 + secs; const hh = Math.floor((s0 / 3600) % 24), mm = Math.floor((s0 / 60) % 60), ss = Math.floor(s0 % 60);
    const p2 = (v) => String(v).padStart(2, '0'); const hot = t > ev.cd0;
    txt(ctx, `${p2(hh)}:${p2(mm)}:${p2(ss)}`, W / 2, 800, { size: 64, color: hot ? '#FF5A4D' : '#F0D9A8', align: 'center', fam: 'Inter', weight: 800 });
  }
  function countdown(ctx, t) {
    for (const k of ev.ticks) { const a = t - k.t; if (a < 0 || a > ev.TICK) continue; const sc = 1 + 0.5 * Math.exp(-a * 9); ctx.save(); ctx.translate(W / 2, 1480 - 380); ctx.scale(sc, sc); G.text(ctx, String(k.n), 0, 0, { size: 260, fam: 'Inter', weight: 800, color: k.n <= 3 ? '#FF3B30' : '#FFD479', align: 'center', stroke: 'rgba(0,0,0,0.5)', strokeW: 10 }); ctx.restore(); }
  }

  // ---------- 字幕 ----------
  function wrap(ctx, text, size, maxW) {
    const out = []; let cur = '';
    for (const ch of text) { if (G.measure(ctx, cur + ch, size, FAM, 400) > maxW) { out.push(cur); cur = ch; } else cur += ch; }
    if (cur) out.push(cur); return out;
  }
  function subs(ctx, t) {
    const l = active(t); if (!l) return; const a = clamp((t - l.t) / 0.15) * clamp((l.end - t) / 0.12 + 0.2);
    const size = 50, rows = wrap(ctx, l.text, size, 840); const bh = rows.length * 68 + 36; const y0 = 1500 - bh - 8;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.beginPath(); ctx.roundRect(60, y0, 960, bh, 24); ctx.fill();
    const name = l.who === 'N' ? '诺诺' : l.who === 'M' ? '路明非' : ''; const col = l.who === 'N' ? '#FF7A7A' : l.who === 'M' ? '#7AC8FF' : '#C9C3B5';
    if (name) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(80, y0 - 26, 28 + name.length * 30, 44, 14); ctx.fill(); txt(ctx, name, 94, y0 + 8, { size: 30, color: '#111' }); }
    rows.forEach((r, i) => txt(ctx, r, W / 2, y0 + 62 + i * 68, { size, color: l.who === 'n' ? '#D8D2C0' : '#fff', align: 'center' }));
    ctx.restore();
  }

  // ---------- 标题 ----------
  function title(ctx, t) {
    if (t > 3.4) return; const a = clamp(1 - (t - 2.6) / 0.8) * clamp(t / 0.4);
    ctx.save(); ctx.globalAlpha = a; txt(ctx, '龙族', W / 2, 150 + 0, { size: 70, color: '#F5D9A0', align: 'center' }); ctx.restore();
  }


  // ---------- 奥丁掷出冈格尼尔 (全屏外景) ----------
  function sleipnir(ctx, t, x, y, k) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    const g = Math.sin(t * 9);
    ctx.fillStyle = '#EEF1F8';
    // 8条腿
    for (let i = 0; i < 8; i++) { const fx = -90 + i * 26 + (i < 4 ? 0 : 10), ph = g * (i % 2 ? 1 : -1); ctx.strokeStyle = i % 2 ? '#C8CEDE' : '#EEF1F8'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx, 40); ctx.lineTo(fx + ph * 40 + (i < 4 ? 30 : -20), 110 + Math.abs(ph) * -10); ctx.lineTo(fx + ph * 60 + (i < 4 ? 50 : -30), 150); ctx.stroke(); }
    G.ellipse(ctx, 0, 0, 130, 56, { fill: '#F4F6FB' });
    G.poly(ctx, [[90, -30], [150, -110], [200, -100], [214, -70], [170, -50], [120, 30]], { fill: '#F4F6FB' });
    G.poly(ctx, [[96, -34], [140, -112], [118, -120], [70, -40]], { fill: '#6C7CD8' }); // 鬃毛
    ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(184, -82, 5, 0, 7); ctx.fill();
    G.poly(ctx, [[-120, -10], [-210, 30 + g * 20], [-190, 70 + g * 20], [-110, 20]], { fill: '#6C7CD8' }); // 尾
    ctx.restore();
  }
  function odinRider(ctx, t, x, y, k, throwP) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    // 暗蓝风氅
    const w = Math.sin(t * 7) * 25; G.poly(ctx, [[-10, -150], [-140 - w, -60], [-260 - w, 20 + w], [-150, 60], [-20, -10]], { fill: '#1B2A66' });
    G.poly(ctx, [[-20, -140], [-110 - w, -50], [-200 - w, 10], [-110, 30]], { fill: '#2C3F94' });
    // 暗金甲胄
    G.poly(ctx, [[-30, -170], [34, -170], [46, -40], [-40, -40]], { fill: '#8C6B2A' });
    G.poly(ctx, [[-20, -160], [24, -160], [30, -90], [-26, -90]], { fill: '#B58F3C' });
    G.ellipse(ctx, -36, -165, 22, 14, { fill: '#B58F3C' }); G.ellipse(ctx, 40, -165, 22, 14, { fill: '#B58F3C' });
    // 掷枪的手臂
    const a = lerp(-2.4, 0.2, ease.outCubic(clamp(throwP))); ctx.strokeStyle = '#8C6B2A'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(30, -160); ctx.lineTo(30 + Math.cos(a) * 90, -160 + Math.sin(a) * 90); ctx.stroke();
    // 青铜面具 + 黄金瞳
    G.ellipse(ctx, 0, -215, 36, 44, { fill: '#9A6A38' }); ctx.strokeStyle = '#5E3C1C'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(0, -180); ctx.moveTo(-22, -200); ctx.lineTo(22, -200); ctx.stroke();
    ctx.shadowColor = '#FFD24A'; ctx.shadowBlur = 25; ctx.fillStyle = '#FFE070'; for (const ex of [-14, 14]) { ctx.beginPath(); ctx.ellipse(ex, -222, 9, 5, 0, 0, 7); ctx.fill(); } ctx.shadowBlur = 0;
    G.poly(ctx, [[-30, -250], [0, -285], [30, -250]], { fill: '#8C6B2A' });
    ctx.restore();
  }
  function odinScene(ctx, t) {
    const p0 = ev.cd0 + 1.3, p = clamp((t - p0) / (ev.cd0 + 5.2 - p0));
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07071A'); g.addColorStop(0.6, '#2A1450'); g.addColorStop(1, '#0B0618'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fl = U.hash(Math.floor(t * 7), 5) > 0.82 ? 0.35 : 0; if (fl) { ctx.fillStyle = `rgba(190,200,255,${fl})`; ctx.fillRect(0, 0, W, H); }
    // 楼群
    for (const [layer, col, base, hmax] of [[0, '#120C2A', 1300, 520], [1, '#07040F', 1500, 700]]) { const rng = U.mulberry32(40 + layer); for (let i = 0; i < 12; i++) { const bw = 90 + rng() * 60, bh = 200 + rng() * hmax; ctx.fillStyle = col; ctx.fillRect(i * 95 - 20, base - bh, bw, bh + 600); if (layer) for (let j = 0; j < 14; j++) if (rng() > 0.7) { ctx.fillStyle = 'rgba(255,220,140,0.6)'; ctx.fillRect(i * 95 + (j % 3) * 24, base - bh + 30 + Math.floor(j / 3) * 44, 10, 16); } } }
    // 风雪
    for (let i = 0; i < 120; i++) { const r = U.hash(i, 51); const x = (U.hash(i, 52) * W - t * 400 * (0.6 + r) + W * 3) % W, y = (U.hash(i, 53) * H + t * 300 * (0.5 + r)) % H; ctx.fillStyle = `rgba(230,240,255,${0.3 + 0.5 * r})`; ctx.fillRect(x, y, 3 + r * 3, 3 + r * 3); }
    // 奥丁骑八足马, 在高处
    const bob = Math.sin(t * 9) * 8; sleipnir(ctx, t, 300, 640 + bob, 1.5); odinRider(ctx, t, 330, 610 + bob, 1.5, (t - p0) / 0.5);
    // 冈格尼尔: 抛物线飞向远处
    const sx = lerp(420, 1180, ease.inQuad(p)), sy = lerp(470, 1100, p) - Math.sin(p * Math.PI) * 380;
    ctx.strokeStyle = 'rgba(176,80,255,0.55)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath();
    for (let q = 0; q <= p; q += 0.02) { const x = lerp(420, 1180, ease.inQuad(q)), y = lerp(470, 1100, q) - Math.sin(q * Math.PI) * 380; q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    if (p > 0.02) { const ex = lerp(420, 1180, ease.inQuad(p + 0.01)), ey = lerp(470, 1100, p + 0.01) - Math.sin((p + 0.01) * Math.PI) * 380; ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.atan2(ey - sy, ex - sx)); ctx.shadowColor = '#B050FF'; ctx.shadowBlur = 40; ctx.fillStyle = '#C9A24A'; ctx.fillRect(-190, -5, 190, 10); ctx.fillStyle = '#17002B'; ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(0, -22); ctx.lineTo(0, 22); ctx.fill(); ctx.restore(); }
    txt(ctx, '奥丁 · 天空与风之王', W / 2, 300, { size: 52, color: '#FFE070', align: 'center', stroke: 'rgba(0,0,0,0.7)', strokeW: 10 });
    txt(ctx, '冈格尼尔——必中之枪', W / 2, 370, { size: 44, color: '#D9A8FF', align: 'center', stroke: 'rgba(0,0,0,0.7)', strokeW: 10 });
    txt(ctx, '空旷的CBD · 巨大的弧线', W / 2, 1560 - 40, { size: 36, color: '#9A8CD0', align: 'center' });
  }

  // ---------- 终幕: 冈格尼尔破幕 ----------
  function spear(ctx, t) {
    if (t < ev.hit - 0.01) return; const p = clamp((t - ev.hit) / (S.ev.black - ev.hit));
    const cx = SCR.x + SCR.w / 2, cy = SCR.y + SCR.h / 2;
    // 裂纹
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; const rng = U.mulberry32(5);
    for (let i = 0; i < 14; i++) { const a = rng() * 6.28, r = 60 + rng() * 280 * Math.min(1, p * 3 + 0.2); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.5 + (rng() - 0.5) * 20, cy + Math.sin(a) * r * 0.5); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); }
    txt(ctx, '冈格尼尔 · 必中', W / 2, 960, { size: 40, color: '#D9A8FF', align: 'center', alpha: clamp(p * 3) });
    const k = ease.inQuad(p); const R = lerp(10, 1700, k);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, `rgba(10,0,20,${0.95 * Math.min(1, p * 4)})`); g.addColorStop(0.6, `rgba(70,10,110,${0.7 * Math.min(1, p * 3)})`); g.addColorStop(1, 'rgba(90,20,140,0)');
    ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
    // 冈格尼尔的矛尖
    ctx.save(); ctx.translate(cx, cy); const s = lerp(0.3, 6, k); ctx.scale(s, s); ctx.shadowColor = '#9B30FF'; ctx.shadowBlur = 40; ctx.fillStyle = '#12001F'; ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(26, 20); ctx.lineTo(-26, 20); ctx.fill(); ctx.fillStyle = '#C9A24A'; ctx.fillRect(-6, 20, 12, 300); ctx.fillStyle = '#7B2CBF'; ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(8, 20); ctx.lineTo(-8, 20); ctx.fill(); ctx.restore();
    const fl = Math.exp(-(t - ev.hit) * 10) * 0.9; if (fl > 0.02) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(-600, -600, W + 1200, H + 1200); }
  }


  // ---------- 运镜 ----------
  const WIDE = { z: 1, x: 540, y: 960 }, CN = { z: 1.6, x: NX, y: 1010 }, CM = { z: 1.6, x: MX, y: 1010 }, TWO = { z: 1.25, x: 485, y: 1010 };
  function camTarget(i, l) {
    if (!l) return WIDE;
    if (l.tag.startsWith('clue')) return { z: 1.05, x: 540, y: 880 };
    if (l.tag === 'intro') return { z: 1.0, x: 540, y: 960 };
    if (l.tag === 'maze' || l.tag === 'loop') return l.who === 'N' ? CN : CM;
    if (l.who === 'n') return TWO;
    if (l.who === 'N') return l.tag === 'gun' ? { z: 1.5, x: 400, y: 1000 } : CN;
    return CM;
  }
  const ci = (t) => lines.findIndex((l) => t >= l.t && t < l.end + 0.08);
  function cam(t) {
    if (t >= ev.cd0) {
      if (t < ev.cd0 + 1.3) { const k = ease.inOutQuad(clamp((t - ev.cd0) / 1.3)); return { z: lerp(1.25, 1.55, k), x: lerp(485, 560, k), y: 1010 }; }
      const k = clamp((t - ev.cd0 - 5.2) / (ev.hit - ev.cd0 - 5.2)); const z = t < ev.hit ? lerp(1.0, 1.15, ease.inQuad(k)) : lerp(1.15, 1.3, clamp((t - ev.hit) / 5));
      return { z, x: 540, y: lerp(960, 800, ease.inOutQuad(clamp((t - ev.cd0 - 5.2) / 1.5))) };
    }
    let i = ci(t); if (i < 0) i = Math.max(0, lines.findIndex((l) => l.t > t) - 1);
    const a = camTarget(i, lines[i]), b = camTarget(i - 1, lines[i - 1] || null), p = ease.inOutCubic(clamp((t - lines[i].t) / 0.55));
    const slow = 1 + 0.06 * clamp((t - lines[i].t) / (lines[i].end - lines[i].t)); // 缓慢推近
    return { z: lerp(b.z, a.z, p) * slow, x: lerp(b.x, a.x, p), y: lerp(b.y, a.y, p) };
  }
  function withCam(ctx, t, fn) { const c = cam(t); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y); fn(); ctx.restore(); }

  // 投影光柱 + 尘埃
  function beam(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(W / 2, 0, W / 2, SCR.y + SCR.h); g.addColorStop(0, 'rgba(255,220,170,0.0)'); g.addColorStop(1, 'rgba(255,220,170,0.10)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W / 2 - 20, -300); ctx.lineTo(W / 2 + 20, -300); ctx.lineTo(SCR.x + SCR.w, SCR.y + SCR.h); ctx.lineTo(SCR.x, SCR.y + SCR.h); ctx.fill();
    for (let i = 0; i < 70; i++) { const r1 = U.hash(i, 21), r2 = U.hash(i, 22); const y = ((r2 * 1400 + t * (20 + r1 * 30)) % 1400) - 200; const x = W / 2 + (r1 - 0.5) * (200 + (y + 300) * 0.7) + Math.sin(t + i) * 12; ctx.fillStyle = `rgba(255,235,200,${0.25 + 0.25 * Math.sin(t * 2 + i)})`; ctx.fillRect(x, y, 3, 3); }
    ctx.restore();
  }
  // 关键字重砸
  const KW = [['23:55', '23:55', '#F5D9A0', 0.2, 260], ['侧写者', '侧写', '#7AC8FF', 0.6, 300], ['梦一定', '12:00', '#FF5A4D', 0.2, 300], ['会有人死', '死', '#FF2A2A', 0.15, 520], ['我喜欢你', '喜欢', '#FF8FC0', 0.3, 300], ['尼伯龙根，是迷宫', '尼伯龙根', '#7DFFE4', 0.1, 220], ['悔恨——', '悔恨', '#9AA6FF', 0.2, 340]];
  function kinetic(ctx, t) {
    for (const [sub, word, col, off, size] of KW) { const l = lines.find((q) => q.text.includes(sub)); if (!l) continue; const a = t - (l.t + off); if (a < 0 || a > 1.3) continue;
      const k = ease.outBack(clamp(a / 0.22), 3) * (1 + 0.04 * a), al = clamp(1 - (a - 0.8) / 0.5);
      ctx.save(); ctx.translate(W / 2 + (a < 0.3 ? U.noise1(t * 60, 4) * 10 : 0), 640); ctx.scale(k, k); ctx.globalAlpha = al * 0.92;
      G.text(ctx, word, 0, 0, { size, fam: FAM, weight: 700, color: col, align: 'center', stroke: 'rgba(0,0,0,0.65)', strokeW: 14, baseline: 'middle' }); ctx.restore(); }
  }
  function embers(ctx, t) { for (let i = 0; i < 40; i++) { const r = U.hash(i, 31); const x = (U.hash(i, 32) * W + Math.sin(t * 0.7 + i) * 40 + W) % W, y = H - ((t * (30 + r * 50) + U.hash(i, 33) * H) % H); ctx.fillStyle = `rgba(255,${120 + r * 100},80,${0.2 + 0.3 * r})`; ctx.fillRect(x, y, 3, 3); } }
  function shock(ctx, t) {
    const a = t - ev.hit; if (a < 0 || a > 1.4) return; const cx = SCR.x + SCR.w / 2, cy = SCR.y + SCR.h / 2;
    for (let i = 0; i < 3; i++) { const q = a - i * 0.12; if (q < 0) continue; ctx.strokeStyle = `rgba(190,110,255,${0.8 * Math.exp(-q * 3)})`; ctx.lineWidth = 16 - i * 4; ctx.beginPath(); ctx.arc(cx, cy, q * 1500, 0, 7); ctx.stroke(); }
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      if (t >= ev.black) { // 黑场 + 尾标
        const a = clamp((t - ev.black - 0.6) / 0.8); G.text && txt(ctx, '《龙族》', W / 2, H / 2, { size: 80, color: '#F5D9A0', align: 'center', alpha: a }); return;
      }
      const shake = t >= ev.hit ? 8 * Math.exp(-(t - ev.hit) * 4) : 0; ctx.save(); ctx.translate(U.noise1(t * 30, 1) * shake, U.noise1(t * 30, 2) * shake);
      if (t >= ev.cd0 + 1.3 && t < ev.cd0 + 5.2) { odinScene(ctx, t); } else withCam(ctx, t, () => { hall(ctx, t); screenContent(ctx, t); beam(ctx, t); seats(ctx); people(ctx, t); frontSeats(ctx); embers(ctx, t); shock(ctx, t); spear(ctx, t); });
      if (t >= ev.cd0 && t < ev.hit) countdown(ctx, t); else digital(ctx, t); kinetic(ctx, t);
      // 时刻压暗
      if (t >= ev.cd0) { const v = 0.25 * (1 + Math.sin(t * 8)) / 2; ctx.fillStyle = `rgba(80,0,0,${v * 0.6})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
      if (t >= ev.death && t < ev.death + 0.5) { ctx.fillStyle = `rgba(255,0,0,${0.35 * (1 - (t - ev.death) / 0.5)})`; ctx.fillRect(0, 0, W, H); }
      title(ctx, t); subs(ctx, t);
    },
    post: { paper: 0, vignette: 0.45, grain: 0.05 },
  });
})();
