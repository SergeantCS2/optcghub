# D7 — the icon: the DON!! panel

A design source for an open decision (DECISIONS-OPEN D7). **Nothing here ships:** `assets/icon.svg` is
still what the build renders, and the build never reads this directory.

## The direction

A manga panel. The ground is aged paper with focus lines and screentone at the edges. At the centre
sits one card, the unit this app counts. Across it is **ドン!!**, the manga sound effect that the card
game's DON!! is named after, drawn here by hand as paths.

Why this one:
- It answers the record's own complaint, "it still reads as Collectr; something One Piece" (AGENDA A24).
- It takes the direction that entry names as the most One Piece: ink and paper, manga on the page.
- It stays inside the line: no character, no publisher mark, no Straw Hat, no crew flag (landmines 26,
  30; A16). ドン is a common Japanese onomatopoeia.
- The katakana is used rather than Latin "DON!!", whose trademark status is UNKNOWN.

## The files

`svg/` holds the source of truth, on the Play icon's 512 frame:

| File | What it is |
|---|---|
| `don-panel.svg` | Play master: a full-bleed square, no corners. Play rounds them at 30 % and adds its own shadow. |
| `don-panel-bg.svg` | Adaptive background, 108 dp canvas (the 512 frame at offset 128). |
| `don-panel-fg.svg` | Adaptive foreground. Measured: reaches 30.1 dp; the safe zone is 33 dp. |
| `don-panel-mono.svg` | Monochrome layer for Android 13+ themed icons. Reaches 30.4 dp. |
| `don-panel-stat.svg` | Status-bar glyph, the word alone, for a future `drawable/ic_stat_*`. |

There are no filters and no fonts, because the build renders with cairosvg.

## Regenerate

From the repo root (needs `cairosvg`, `pillow`, and a Chromium for the sheets):

```bash
python3 design/d7-icons/gen_don.py                          # rewrites svg/
python3 design/d7-icons/render_ctx.py design/d7-icons/svg ../d7-build/tiles
python3 design/d7-icons/sheets_don.py ../d7-build
chromium --headless=new --window-size=1080,4200 --screenshot="$PWD/../d7-build/sheet-1.png" "file://$PWD/../d7-build/don-sheet-1.html"
```

`render_ctx.py` also renders today's `assets/icon.svg` the way `ci/apk.sh` builds it, for the comparison.
Rendered PNGs and HTML are generated; keep them out of the tree.

## If this is chosen, the take that ships it

- **Render real adaptive layers.** `ci/apk.sh` (the launcher-icon step) should render `-bg` and `-fg`
  as real layers, plus `-mono` as `<monochrome>`. Today it shrinks the whole square onto `#05080A`,
  and there is no monochrome layer.
- **Give the reminders an icon they can find.** They pass `smallIcon: 'ic_launcher'` (`src/app.html`).
  `@capacitor/local-notifications` 8.3.1 looks that name up only among drawables, finds nothing (it is
  a mipmap), and falls back to `android.R.drawable.ic_dialog_info`. This is read from the plugin
  source, not yet seen on the Fold. The fix:
  - ship `drawable/ic_stat_don.png` from `-stat`
  - point `smallIcon` at it
  - keep it with `tools:keep`, since `shrinkResources` is on (`ci/shrink.py`; landmine 141's shape)
- **Upload the master as it is.** It becomes the Play icon; the feature graphic follows it.
