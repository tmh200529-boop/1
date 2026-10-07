// 配乐: 80BPM 小调, 音乐盒 + 铺底 + 弦乐, 倒计时心跳与秒针, 枪尖破幕。
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, clock } = sc;
const N = Math.ceil(DURATION * SR); const bus = () => new Bus(N);
const keys = bus(), pad = bus(), str = bus(), bass = bus(), perc = bus(), fx = bus(), verb = bus();

// 音乐盒主旋律 (只到倒计时前)
for (const n of sc.motif) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.30); verb.addMono(mb, n.t, 0.22); }
// 铺底 + 弦乐 (情感段加强)
for (const c of sc.chords) {
  if (c.t0 >= ev.black) continue;
  const t1 = Math.min(c.t1, ev.black), hot = c.t0 >= ev.love && c.t0 < ev.cd0, quiet = c.t0 < ev.clues[0].t;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: hot ? 1600 : 900, attack: 0.6, release: 1.2 }); pad.addStereo(L, R, c.t0, quiet ? 0.07 : 0.1); }
  if (hot || c.t0 >= ev.cd0) for (const n of c.notes) { const s = I.strings(n + 12, t1 - c.t0, { attack: 0.5, release: 1.0 }); str.addStereo(s.L, s.R, c.t0, c.t0 >= ev.cd0 ? 0.12 : 0.16); }
  if (!quiet) bass.addMono(I.bass(c.bass, (t1 - c.t0) * 0.9, { sub: 0.7 }), c.t0, 0.5);
}
// 线索段: 皮齐卡托 "滴答"
for (const c of ev.clues) { for (let i = 0; i < 6; i++) perc.addMono(I.pizz(m('A4') + (i % 3) * 3), c.t + i * 0.375, 0.25); fx.addMono(I.pop(1.2), c.t, 0.25); }
// 秒针滴答 (腕表)
for (let t = ev.watch; t < ev.cd0; t += 1) fx.addMono(I.woodTick(0.9), t, 0.08);
// 倒计时: 心跳 + 秒针 + 上升
for (const k of ev.ticks) { fx.addMono(I.woodTick(1.2), k.t, 0.4); perc.addMono(I.heartbeat(), k.t + 0.02, 0.5); perc.addMono(I.timpani(m('A1')), k.t, 0.25 + (10 - k.n) * 0.04); }
fx.addMono(I.noiseSweep(ev.hit - ev.cd0, 200, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), ev.cd0, 0.35);
// 命中: 重低音 + 镲 + 玻璃, 随后音乐盒单音
fx.addMono(I.subBoom(3.0), ev.hit, 0.9); perc.addMono(I.crash(3), ev.hit, 0.5); fx.addMono(I.thwack(), ev.hit, 0.4);
fx.addMono(I.noiseSweep(1.2, 9000, 600, { q: 1, pink: true }), ev.hit, 0.3);
const tail = [['A4', 0.9], ['C5', 1.8], ['E5', 2.7], ['A5', 3.8]];
for (const [n, dt] of tail) { const mb = I.musicBox(m(n)); keys.addMono(mb, ev.hit + dt, 0.3); verb.addMono(mb, ev.hit + dt, 0.3); }
for (const n of ['A3', 'C4', 'E4'].map(m)) { const { L, R } = I.padNote(n, 5.5, { cutoff: 900, attack: 1.0, release: 2.0 }); pad.addStereo(L, R, ev.hit + 1.0, 0.1); }

const stems = { keys, pad, str, bass, perc, fx, verb: reverb(verb, { room: 0.88, damp: 0.35 }) };
const GAIN = { keys: 1.0, pad: 2.4, str: 2.2, bass: 0.8, perc: 1.0, fx: 1.0, verb: 1 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22); MIX.fadeOut(mix, DURATION - 2.2, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(1)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
