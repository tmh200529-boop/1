// 《龙族》片段 — 午夜十二点前的放映厅。score.js = 声音与画面共用的时间轴。
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, placeBar, makeChords } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const STYLE = 'flat';
  const clock = makeClock({ bpm: 80, offset: 0 }); // 1 bar = 3s
  const { T, BEAT } = clock;

  // ---------- 台词时间轴 (who: n 旁白 / N 诺诺 / M 路明非) ----------
  const RAW = [
    ['n', '深夜。放映厅里，银幕上放着《机器人总动员》。', 3.0, 'intro'],
    ['N', '“这部电影我看过的。”诺诺说，“之后瓦力就醒过来了。”', 3.8, 'wake'],
    ['M', '“嗯，是这个情节。”', 1.8, ''],
    ['n', '路明非说着看了看腕表——深夜11点55分。', 3.0, 'watch'],
    ['N', '“别看表了，你在赶时间，对么？”', 2.8, 'gun'],
    ['N', '“所以你只给我看了后半截——前半截我们没时间看了。”', 3.8, 'gun'],
    ['M', '“对。”', 1.2, ''],
    ['N', '“你来过这里，经历过我们现在经历的一切，而且很多遍。”', 4.0, 'gun'],
    ['M', '“师姐你是怎么看出来的？”', 2.2, ''],
    ['N', '“你拿衣服，准确拿了我的号。”', 2.3, 'clue:shirt'],
    ['N', '“后半截拷贝，你想都没想就拿了下来。”', 2.5, 'clue:reel'],
    ['N', '“还有那支不知从哪里拿出来的火箭筒。”', 2.5, 'clue:rocket'],
    ['N', '“没爆的轮胎——你怎知哪个胎出了问题？”', 2.6, 'clue:tire'],
    ['N', '“除了那间工厂的十五分钟，你一秒都没浪费，卡着表走。”', 3.6, 'clue:clock'],
    ['M', '“不是浪费时间，是看电影。”', 2.5, ''],
    ['N', '“告诉我这到底是怎么回事。我是侧写者，你瞒不过我。”', 3.8, 'gun'],
    ['M', '“就当这是一场梦吧——我们俩共同的梦境。”', 3.4, 'loop'],
    ['M', '“我来过很多次。梦一定在12点结束，所以只能看半部电影。”', 4.4, 'loop'],
    ['N', '“12点到来的时候会怎么样？”', 2.6, ''],
    ['M', '“我们中会有人死。”', 2.2, 'death'],
    ['N', '“是我，对不对？是你的话你会恐惧，是我的话你会悲伤。”', 4.0, ''],
    ['M', '“师姐，我喜欢你，从你在这间放映厅捡到我的那天开始。”', 4.4, 'love'],
    ['M', '“你不会记得，但我会。”', 2.4, 'love'],
    ['N', '“嗯。”', 1.2, 'love'],
    ['M', '“我们逃不出去的。这里是尼伯龙根，是迷宫。”', 3.4, 'maze'],
    ['M', '“规则可能是：必须死一个人，另一个才能活着离开。”', 3.6, 'maze'],
    ['M', '“当年死的那个人，是师兄的老爹。”', 2.4, 'maze'],
    ['N', '“或者说这根本只是个梦而已，你在害怕什么？”', 3.2, 'lower'],
    ['M', '“这个梦会变成现实。我一遍遍进来，就是想找到救你的方法。”', 4.0, 'lower'],
    ['N', '“既然找不到救我的方法，为什么不找救你自己的？”', 3.4, 'lower'],
    ['M', '“师兄说，他宁愿死在15岁那夜，也不要独自把老爹丢在那里。”', 4.2, 'regret'],
    ['M', '“人最痛苦的是悔恨——你恨的不是别人，而是自己。”', 3.6, 'regret'],
    ['M', '“如果只有一个人能活，我希望是你。我害怕你死了，我会悔恨。”', 4.6, 'regret'],
    ['N', '“别说那么恶心的话。如果这真是我的结局，我就接受。”', 4.2, 'popcorn'],
  ];
  const lines = []; let tt = 0.2;
  for (const [who, text, dur, tag] of RAW) { lines.push({ who, text, t: tt, end: tt + dur, tag }); tt += dur + 0.08; }
  const tagStart = (tag) => lines.find((l) => l.tag.startsWith(tag)).t;
  const cd0 = tt + 0.2;          // 倒计时开始 ("还剩10秒")
  const TICK = 0.65;
  const hit = cd0 + 10 * TICK;   // 枪尖贯穿银幕
  const lastLine = { who: 'M', text: '“不，师姐，这不会是你的结局……这是我的。”', t: hit + 0.3, end: hit + 5.6, tag: 'final' };
  lines.push(lastLine);
  const blackAt = lastLine.end;
  const DURATION = blackAt + 3.2;

  const ev = { watch: tagStart('watch'), wake: lines[1].end, cd0, hit, final: lastLine.t, black: blackAt, TICK,
    ticks: Array.from({ length: 10 }, (_, i) => ({ n: 10 - i, t: cd0 + i * TICK })),
    gunLower: tagStart('lower'), death: tagStart('death'), love: tagStart('love'), loop: tagStart('loop'), maze: tagStart('maze'), regret: tagStart('regret'), pop: tagStart('popcorn'),
    clues: lines.filter((l) => l.tag.startsWith('clue')).map((l) => ({ t: l.t, end: l.end, kind: l.tag.slice(5) })) };

  // 腕表时间: 23:55:00 → 23:59:50 (倒计时开始) → 00:00:00 (命中)
  const clockSecs = (t) => (t < cd0 ? U.remap(t, ev.watch, cd0, 0, 290) : U.remap(Math.min(t, hit), cd0, hit, 290, 300));

  const S = { act1: [0, ev.clues[0].t], clues: [ev.clues[0].t, ev.clues[4].end], dream: [ev.clues[4].end, ev.love], love: [ev.love, ev.maze], maze: [ev.maze, ev.regret], regret: [ev.regret, cd0], count: [cd0, hit], end: [hit, DURATION] };

  // ---------- harmony: Am F C G ----------
  const PROG = ['Am', 'F', 'C', 'G'];
  const table = {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A2' }, F: { notes: ['A3', 'C4', 'F4'], bass: 'F2' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' }, G: { notes: ['G3', 'B3', 'D4'], bass: 'G2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' }, E: { notes: ['G#3', 'B3', 'E4'], bass: 'E2' },
  };
  const NB = Math.ceil(DURATION / (BEAT * 4)) + 1;
  const rows = [];
  for (let b = 0; b < NB; b++) {
    const t = T(b);
    let name = PROG[b % 4];
    if (t >= ev.clues[0].t && t < ev.clues[4].end) name = ['Am', 'Dm', 'Am', 'E'][b % 4];
    if (t >= cd0) name = ['Am', 'E'][b % 2];
    rows.push([b, 0, 4, name]);
  }
  const { chords, chordAt } = makeChords(clock, table, rows);

  // 音乐盒旋律 (8分音符网格)
  const MOTIF = { Am: [['E5', 0, 2], ['C5', 2, 1], ['A4', 3, 1], ['C5', 4, 2], ['B4', 6, 2]], F: [['C5', 0, 2], ['A4', 2, 1], ['F4', 3, 1], ['A4', 4, 2], ['G4', 6, 2]],
    C: [['G4', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 4]], G: [['B4', 0, 2], ['D5', 2, 1], ['G5', 3, 1], ['F#5', 4, 4]], Dm: [['D5', 0, 2], ['A4', 2, 2], ['F5', 4, 2], ['E5', 6, 2]], E: [['B4', 0, 2], ['G#4', 2, 2], ['E5', 4, 4]] };
  const motif = [];
  for (let b = 0; b < NB; b++) { const nm = rows[b][3]; for (const n of placeBar(clock, MOTIF[nm], b, 0)) if (n.t < cd0) motif.push(n); }

  const markers = {
    wake: ev.wake, watch: ev.watch, clue: ev.clues[0].t, love: ev.love, maze: ev.maze, regret: ev.regret, countdown: cd0,
    death: ev.death, hit: { t: hit, sync: 'av' }, final: lastLine.t, black: blackAt,
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, S, m, chords, chordAt, ev, lines, markers, motif, clockSecs, rows };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
