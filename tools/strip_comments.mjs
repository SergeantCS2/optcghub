/* Remove every comment from a JavaScript file and nothing else.
 *
 * Take 35, part of the scrubber. A regex cannot tell a comment from a URL in
 * a string or a regex literal; a parser can. acorn reports the exact byte
 * range of every comment, those ranges are cut, and every other byte stays
 * where it was -- so the harness's assertions about the CODE still hold and
 * any assertion that was secretly matching a comment fails, which is the
 * point (landmine 111).
 *
 *   node tools/strip_comments.mjs in.js out.js
 */
import fs from 'node:fs';
import * as acorn from 'acorn';
const [src, dst] = process.argv.slice(2);
const code = fs.readFileSync(src, 'utf8');
const comments = [];
acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', onComment: comments, allowHashBang: true });
let out = '', last = 0;
for (const c of comments) { out += code.slice(last, c.start); last = c.end; }
out += code.slice(last);
out = out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');   // trailing space and blank runs the cuts left behind
fs.writeFileSync(dst, out);
console.log(`${comments.length} comments removed: ${code.length} -> ${out.length} bytes`);
