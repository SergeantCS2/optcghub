/* =====================================================================
 * THE SCANNER'S STAGES -- take 10, rebuilt at take 125 (A2); put in app.js by build_app.py
 *
 * Each stage a plain function, so the harness drives them with synthetic
 * input and the only thing left unproven is the camera itself (A2):
 *
 *   the view the guide shows ─► a look (whole | near | glare | turned) ─► OCR: every line and its place
 *     ─► codesIn: the lines that are a real card number, printed on a card that is in the view
 *     ─► none | several | one number ─► the card: the quad, only where the number sits where the quad says
 *                                          └► the photo (the quad's warp, or the view at a card's shape)
 *                                          └► the face: the SP badge in the line, or the star on a trusted warp
 *     ─► vote (2 of 3, the decided number held while it stays in view) ─► resolve ─► auto | picker   [app.html]
 *
 * Take 125: the number is found by the recogniser, not by the card outline. Take 10's outline was
 * a box round every pixel brighter than the frame's mean; on the owner's fifteen photographs of
 * his own cards -- foils, sleeves, toploaders, a binder, a couch, a carpet -- it was the whole
 * frame on fourteen and nothing on the fifteenth, so the code crop cut from it held no code and
 * take 123's stages read 0 of 15 (MEASURED, HANDOFF take 125). ML Kit finds text anywhere in a
 * picture; the view goes to it whole and the number is picked out of the lines it returns.
 * ===================================================================== */
const CANON = { w: 500, h: 700 };
const ASPECT = 63 / 88;
/* no anchors (landmine 63). The dash may be lost or misread -- a dot, a dash of another width, a
   gap -- and every such read loses it to normaliseRead; two set digits and three card digits still
   make one number, so it is put back. A promo keeps its dash: P and three digits is too little. */
const CODE_RE = /(?:OP|ST|EB|PRB|LT)\d{2}-?\d{3}|P-\d{3}/;
/* Where the number's line sits on a card: its centre 84 % across and 95.2 % down. MEASURED take 125
   on 51 card pictures at the CDN (every treatment of 17 numbers; a camera-text reader standing in for
   ML Kit): the centre 0.950 to 0.958 down, 0.817 to 0.853 across (the SP badge's line starts further
   left). So a card with its number in the view's top or left quarter is mostly out of the view --
   in view whole it would fill under a quarter of it -- and its number is not the card's in hand. */
const CODE_AT = { x: 0.84, y: 0.952 };
const OCR_MAX = 1600;   // the longest side handed to the recogniser; the Fold's 1080 x 1920 view is under it

/* ---- stage 1: the view -- what the guide shows of the source ------------
   The video fills the guide with object-fit: cover, so the guide shows the middle of the frame;
   the parts cut off are not the collector's to answer for. A still photo is its own view. */
function viewRect(sw, sh, ew, eh) {
  const s = Math.max(ew / sw, eh / sh), w = Math.min(sw, ew / s), h = Math.min(sh, eh / s);
  return { x: (sw - w) / 2, y: (sh - h) / 2, w, h };
}
/* the view as a canvas of at most OCR_MAX, turned a quarter each `turn` (+1 clockwise, -1 anti) */
function viewCanvas(src, v, turn = 0) {
  const s = Math.min(1, OCR_MAX / Math.max(v.w, v.h)), w = Math.round(v.w * s), h = Math.round(v.h * s);
  const c = document.createElement('canvas');
  c.width = turn ? h : w; c.height = turn ? w : h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.translate(c.width / 2, c.height / 2); g.rotate(turn * Math.PI / 2);
  g.drawImage(src, v.x, v.y, v.w, v.h, -w / 2, -h / 2, w, h);
  return c;
}

/* ---- stage 2: the looks -------------------------------------------------
   One capture, one look. The live loop keeps a look while it reads and moves to the next when it
   does not. MEASURED take 125 on the owner's fifteen frames, the camera-text reader standing in for
   ML Kit (INFERRED to carry: ML Kit is built for camera text and is the stronger of the two):
   whole alone 7 of 15; with near and glare, 12 of 15; take 123's stages 0. */
const LOOKS = [
  { name: 'whole' },
  { name: 'near', part: { x: 0.3, y: 0.5, w: 0.7, h: 0.5 }, zoom: 2 },   // the corner the number is printed in, twice the size
  { name: 'glare', even: true },    // local contrast: a foil's shine or a sleeve's no longer sets it for the number (landmine 10)
  { name: 'left', turn: -1 },       // a card lying on its side
  { name: 'right', turn: 1 },
];
/* the canvas a look hands the recogniser, and how to map a place in it back onto the view's canvas */
function lookCanvas(base, look) {
  const p = look.part || { x: 0, y: 0, w: 1, h: 1 };
  const sx = p.x * base.width, sy = p.y * base.height, sw = p.w * base.width, sh = p.h * base.height;
  const scale = Math.min(look.zoom || 1, OCR_MAX / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(base, sx, sy, sw, sh, 0, 0, c.width, c.height);
  if (look.even) equalise(c);
  return { canvas: c, toBase: b => ({ x: sx + b.x / scale, y: sy + b.y / scale, w: b.w / scale, h: b.h / scale }) };
}
/* CLAHE on the luminance, grey out (landmine 10 named it before take 10): the picture in 8 x 8 tiles,
   each tile's histogram clipped at `clip` times its mean and equalised, every pixel blended from the
   four tiles nearest it. OpenCV's own recipe; the take-125 measure read it with OpenCV's. */
function equalise(c, tiles = 8, clip = 3) {
  const g = c.getContext('2d', { willReadFrequently: true }), W = c.width, H = c.height;
  const im = g.getImageData(0, 0, W, H), d = im.data, L = new Uint8Array(W * H);
  for (let i = 0, p = 0; p < L.length; i += 4, p++) L[p] = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
  const tw = W / tiles, th = H / tiles, maps = [];
  for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) {
    const x0 = Math.floor(tx * tw), x1 = Math.floor((tx + 1) * tw), y0 = Math.floor(ty * th), y1 = Math.floor((ty + 1) * th);
    const hist = new Float64Array(256), n = Math.max(1, (x1 - x0) * (y1 - y0));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) hist[L[y * W + x]]++;
    const lim = Math.max(1, clip * n / 256); let over = 0;
    for (let v = 0; v < 256; v++) if (hist[v] > lim) { over += hist[v] - lim; hist[v] = lim; }
    const map = new Uint8Array(256); let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v] + over / 256; map[v] = Math.min(255, Math.round(acc * 255 / n)); }
    maps.push(map);
  }
  const near = (f, n) => { f = Math.min(n - 1, Math.max(0, f - 0.5)); const a = Math.floor(f); return [a, Math.min(n - 1, a + 1), f - a]; };
  for (let y = 0; y < H; y++) {
    const [ya, yb, wy] = near((y + 0.5) / th, tiles);
    for (let x = 0; x < W; x++) {
      const [xa, xb, wx] = near((x + 0.5) / tw, tiles), v = L[y * W + x], i = (y * W + x) * 4;
      const top = maps[ya * tiles + xa][v] * (1 - wx) + maps[ya * tiles + xb][v] * wx;
      const bot = maps[yb * tiles + xa][v] * (1 - wx) + maps[yb * tiles + xb][v] * wx;
      d[i] = d[i + 1] = d[i + 2] = top * (1 - wy) + bot * wy;
    }
  }
  g.putImageData(im, 0, 0);
  return c;
}

/* ---- stage 3: OCR text -> a card number, or nothing ---------------------- */
function normaliseRead(t) {
  let s = String(t || '').toUpperCase().replace(/\s+/g, '');
  s = s.replace(/(?<=\d)O/g, '0').replace(/O(?=\d)/g, '0')
       .replace(/(?<=\d)I/g, '1').replace(/I(?=\d)/g, '1')
       .replace(/(?<=\d)S/g, '5');
  return s.replace(/[^A-Z0-9-]/g, '');
}
function parseRead(text) {
  const norm = normaliseRead(text);
  const m = norm.match(CODE_RE);
  const number = m ? (m[0].includes('-') ? m[0] : m[0].slice(0, -3) + '-' + m[0].slice(-3)) : null;
  /* Landmine 65: a read that is not a real card number is a NO read. */
  const valid = number && CAT.valid.has(number) ? number : null;
  /* Landmine 61: the SP badge is literal text on the number's line. */
  const sp = /(^|[^A-Z])SP(?=[A-Z]{1,3}\d)/.test(norm) || /^SP/.test(norm);
  return { number: valid, raw: text, sp };
}
/* every line of a read that is a real card number, printed on a card that is upright in this look and in
   the view, and not contradicted by the card's own words. A line without a place is taken at its word.
   Upright: the line runs across (wider than twice its height). A turned look turns every card in it, so a
   neighbour's number there runs down the picture and its place says nothing (MEASURED take 125: the turned
   looks read three neighbours' numbers on the owner's upright photos until this). In the view: not in the
   look's top or left quarter (CODE_AT). */
function codesIn(read, w, h) {
  const onCard = b => !b || (b.w >= 2 * b.h && b.x + b.w / 2 >= w / 4 && b.y + b.h / 2 >= h / 4);
  const words = squash(read.text);
  return read.lines.map(l => ({ ...parseRead(l.text), box: l.box }))
    .filter(r => r.number && onCard(r.box) && !misnamed(r.number, words) && !upsideDown(r, read.lines));
}
/* An upright card prints its name above its number. A line that is the number's own name, below it, is a
   card upside down in this look -- a neighbour a turned look turned over (MEASURED take 125: the owner's
   sideways Bonney, whose neighbour's number the other turn read) -- and its number is not taken. */
function upsideDown(r, lines) {
  const names = namesOf(r.number), mid = b => b.y + b.h / 2;
  return !!r.box && lines.some(l => l.box && names.has(squash(l.text)) && mid(l.box) > mid(r.box));
}
/* A misread lands a digit away -- the owner's close-up of Kyros, OP10-046, read OP10-040 in two looks alike,
   so two reads can agree on it (MEASURED take 125). The name printed large on the card then belongs to the
   number misread. A read is refused when the words name a card one digit from it and not its own: refused,
   never corrected -- a name in an effect's text is not the card's. Names under four letters prove nothing. */
const squash = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const namesOf = n => new Set((CAT.byNum.get(n) || []).map(p => squash(p.name)).filter(x => x.length >= 4));
function misnamed(number, words) {
  const own = namesOf(number);
  if ([...own].some(x => words.includes(x))) return false;
  for (let i = 0; i < number.length; i++) {
    if (!/\d/.test(number[i])) continue;
    for (let d = 0; d < 10; d++) {
      const m = number.slice(0, i) + d + number.slice(i + 1);
      if (m !== number && CAT.valid.has(m) && [...namesOf(m)].some(x => !own.has(x) && words.includes(x))) return true;
    }
  }
  return false;
}

/* ---- stage 4: the card -- take 10's outline, kept only where the number agrees ----
   Luminance bounding box, as the Phase 0 rig measured it: a card on a dark table is a bright quad
   with aspect ~0.716. Anywhere else it is whatever is bright (the whole frame, MEASURED take 125),
   so it is believed only when the number sits where it would on that card, within 2 % down and
   10 % across of CODE_AT; the star is looked for on no other warp (landmine 64: its box has no
   room for a guess). */
const _work = document.createElement('canvas');
function detectQuad(src, sw, sh) {
  const W = 160, H = Math.round(W * sh / sw);
  _work.width = W; _work.height = H;
  const c = _work.getContext('2d', { willReadFrequently: true });
  c.drawImage(src, 0, 0, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  let sum = 0;
  const lum = new Float32Array(W * H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    lum[p] = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; sum += lum[p];
  }
  const thr = (sum / (W * H)) * 1.18;
  let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (lum[y * W + x] > thr) {
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (n < W * H * 0.06) return null;
  const w = x1 - x0, h = y1 - y0;
  if (w < 8 || h < 8) return null;
  const ar = w / h;
  if (ar < ASPECT * 0.78 || ar > ASPECT * 1.22) return null;
  const sx = sw / W, sy = sh / H;
  return { x: x0 * sx, y: y0 * sy, w: w * sx, h: h * sy };
}
function cardAround(base, code) {
  const q = code && detectQuad(base, base.width, base.height);
  if (!q) return null;
  const cx = (code.x + code.w / 2 - q.x) / q.w, cy = (code.y + code.h / 2 - q.y) / q.h;
  return Math.abs(cx - CODE_AT.x) <= 0.1 && Math.abs(cy - CODE_AT.y) <= 0.02 ? q : null;
}
/* the view at a card's shape, centred: the photo when no outline is believed */
function fitCard(c) {
  const w = Math.min(c.width, c.height * ASPECT), h = w / ASPECT;
  return { x: (c.width - w) / 2, y: (c.height - h) / 2, w, h };
}
function warpCanonical(src, q) {
  const full = document.createElement('canvas');
  full.width = CANON.w; full.height = CANON.h;
  full.getContext('2d').drawImage(src, q.x, q.y, q.w, q.h, 0, 0, CANON.w, CANON.h);
  return full;
}

/* ---- stage 5: the star detector, ported from tools/star_template.py ------
   Zero-mean unit-variance patch, correlated against the committed template.
   Threshold, box and held-out evidence all travel WITH the template in the
   bundle, so the app cannot ship a detector without its numbers. The patch is
   scored as cut: a contrast stretch before it (take 10 to 123) is a linear map
   the zero-mean unit-variance step undoes. */
function cropStar(full) {
  const T = CAT.star; if (!T) return null;
  const [bx, by, bw, bh] = T.box, c = document.createElement('canvas');
  c.width = Math.round(CANON.w * bw); c.height = Math.round(CANON.h * bh);
  c.getContext('2d').drawImage(full, Math.round(CANON.w * bx), Math.round(CANON.h * by), c.width, c.height, 0, 0, c.width, c.height);
  return c;
}
function starScore(starCanvas) {
  const T = CAT.star; if (!T || !starCanvas) return null;
  const c = document.createElement('canvas');
  c.width = T.w; c.height = T.h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(starCanvas, 0, 0, T.w, T.h);
  const d = g.getImageData(0, 0, T.w, T.h).data;
  const n = T.w * T.h, v = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) { v[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114; mean += v[i]; }
  mean /= n;
  let sd = 0;
  for (let i = 0; i < n; i++) sd += (v[i] - mean) ** 2;
  sd = Math.sqrt(sd / n) || 1e-6;
  let dot = 0;
  for (let i = 0; i < n; i++) dot += ((v[i] - mean) / sd) * T.template[i];
  return dot / n;
}

/* ---- stage 6: one capture, start to finish ------------------------------
   Landmine 60: narrow ONLY on a sighting -- below the star's threshold is "nothing seen", never "plain". */
async function identifyFrame(src, view, look = LOOKS[0]) {
  const base = viewCanvas(src, view, look.turn);
  const { canvas, toBase } = lookCanvas(base, look);
  const read = await PLATFORM.ocr(canvas);
  if (!read) return { stage: 'no-ocr' };
  if (!read.lines.length) return { stage: 'no-text' };
  const hits = codesIn(read, canvas.width, canvas.height);
  const numbers = [...new Set(hits.map(r => r.number))];
  if (!numbers.length) return { stage: 'no-read', raw: read.text };
  if (numbers.length > 1) return { stage: 'several', numbers, raw: read.text };
  const hit = hits.find(r => r.sp) || hits[0];
  const card = cardAround(base, hit.box && toBase(hit.box));
  const full = warpCanonical(base, card || fitCard(base));
  const sc = card ? starScore(cropStar(full)) : null;
  const face = hit.sp ? 'sp' : sc != null && sc >= CAT.star.threshold ? 'star' : null;
  return { stage: 'read', number: hit.number, face, full, card, base, raw: read.text };
}

/* ---- stage 7: temporal voting -------------------------------------------
   Landmine 65: single-frame noise is the residual 2%, and two agreeing reads of
   the last three remove it without touching recall. Take 125: the number decided
   is then HELD -- not decided again while it stays in view -- and let go after
   `release` captures that do not read it (push(null) is a capture that read
   nothing). Take 10's 800 ms cooldown (landmine 16) was never set: a card left
   in view was counted again every two reads. Captures, not time, so a picker's
   wait is not the card leaving. Being named ANOTHER number does not stop a vote
   for it; it counts toward the held one's release. */
function makeVoter(size = 3, need = 2, release = 3) {
  const buf = []; let held = null, gone = 0;
  return {
    get held() { return held; },
    push(number) {
      if (held) { if (number === held) { gone = 0; return null; } if (++gone >= release) held = null; }
      if (!number) return null;
      buf.push(number); if (buf.length > size) buf.shift();
      const counts = {};
      for (const n of buf) counts[n] = (counts[n] || 0) + 1;
      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!best || best[1] < need) return null;
      buf.length = 0; held = best[0]; gone = 0;
      return held;
    },
    reset() { buf.length = 0; held = null; gone = 0; }
  };
}
