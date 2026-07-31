#!/bin/bash
#
# Rebuild the self-hosted webfonts: Font Awesome and Academicons subsets, plus Inter.
#
# The site uses ~36 of Font Awesome's ~2000 icons and 6 of Academicons' ~150.
# Shipping both in full costs 100 KB of render-blocking CSS plus 267 KB of
# webfonts from a third-party origin, and another 128 KB .woff locally;
# subsetting brings the pair to roughly 10 KB.
#
# Run this after adding or removing an icon in the markup or in JS. It scans for
# the classes actually used, so no list needs maintaining by hand.
#
# Requires: fontTools + brotli  (pip3 install --user fonttools brotli)
#
# Usage: tools/build-webfonts.sh
#
set -euo pipefail

FA_VERSION="6.5.1"
CDN="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${FA_VERSION}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PYBIN="$(python3 -c 'import site,sys; print(site.USER_BASE + "/bin")')"
export PATH="$PYBIN:$PATH"

command -v pyftsubset >/dev/null || {
  echo "pyftsubset not found. Run: pip3 install --user fonttools brotli" >&2
  exit 1
}

echo "==> Fetching Font Awesome ${FA_VERSION}"
curl -sL "${CDN}/css/all.min.css" -o "$WORK/all.min.css"
curl -sL "${CDN}/webfonts/fa-solid-900.woff2" -o "$WORK/fa-solid-900.woff2"
curl -sL "${CDN}/webfonts/fa-brands-400.woff2" -o "$WORK/fa-brands-400.woff2"

echo "==> Scanning for icon classes in use"
python3 - "$ROOT" "$WORK" <<'PY'
import json, os, re, sys
from fontTools.ttLib import TTFont

root, work = sys.argv[1], sys.argv[2]

# Classes appear in markup (class="..."), in JS (className assignments, innerHTML
# templates, classList.toggle) and in inline onclick handlers that swap an icon.
used = set()
for base, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if not d.startswith((".", "_", "node_modules"))]
    for name in files:
        if not name.endswith((".html", ".js")):
            continue
        if name.startswith("_"):
            continue
        text = open(os.path.join(base, name), encoding="utf-8").read()
        for pat in (r'class="([^"]*)"',
                    r'''class(?:Name)?\s*=\s*['"]([^'"]*)['"]''',
                    r'''class=\\?["']([^"'\\]*)''',
                    # classList.add/remove/toggle('fa-x') and bare 'fa-x' strings
                    r'''classList\.(?:add|remove|toggle|contains)\(\s*['"]([^'"]+)['"]''',
                    r'''['"](fa-[a-z0-9-]+)['"]'''):
            for m in re.finditer(pat, text):
                used.update(m.group(1).split())

icons = {c for c in used
         if re.fullmatch(r"fa-[a-z0-9-]+", c)
         and c not in ("fa-brands", "fa-solid", "fa-regular", "fa-spin", "fa-fw")}

# Some glyphs are referenced by raw codepoint rather than by class — our own CSS
# sets font-family: "Font Awesome 6 Free" with content: "\f077" for the news
# toggle arrows. Those never appear as a class, so scan for them explicitly or
# the subset silently drops them.
raw_codepoints = set()
for base, dirs, files in os.walk(os.path.join(root, "static", "stylesheets")):
    # Skip vendored bundles: Academicons also uses content: "\e9xx" codepoints
    # for its own font, which are irrelevant here.
    if os.path.basename(base) == "css":
        continue
    for name in files:
        if not name.endswith(".css") or name == "fontawesome-subset.css":
            continue
        text = open(os.path.join(base, name), encoding="utf-8").read()
        if "Font Awesome" not in text:
            continue
        for m in re.finditer(r'content:\s*"\\([0-9a-fA-F]{3,5})"', text):
            raw_codepoints.add(m.group(1).lower())
if raw_codepoints:
    print(f"    raw codepoints in CSS: {sorted('U+'+c.upper() for c in raw_codepoints)}")

# Resolve each class to its codepoint. Aliases share one rule, so match the
# exact selector token rather than a substring.
css = open(os.path.join(work, "all.min.css"), encoding="utf-8").read()
groups = []
for m in re.finditer(r'([^{}]*)\{content:"\\([0-9a-f]+)"\}', css):
    sels = {s.strip().replace(":before", "") for s in m.group(1).split(",")}
    groups.append((sels, m.group(2)))

resolved, unknown = {}, []
for icon in sorted(icons):
    for sels, cp in groups:
        if "." + icon in sels:
            resolved[icon] = cp
            break
    else:
        unknown.append(icon)

# Assign each icon to a family by checking the real font cmaps, not a hardcoded
# list of brand names.
cmaps = {}
for fam, path in (("solid", "fa-solid-900.woff2"), ("brand", "fa-brands-400.woff2")):
    font = TTFont(os.path.join(work, path))
    chars = set()
    for table in font["cmap"].tables:
        chars |= set(table.cmap.keys())
    cmaps[fam] = chars

split = {"solid": {}, "brand": {}}
for icon, cp in resolved.items():
    n = int(cp, 16)
    if n in cmaps["brand"]:
        split["brand"][icon] = cp
    elif n in cmaps["solid"]:
        split["solid"][icon] = cp
    else:
        unknown.append(icon)

# Keep the raw-codepoint glyphs too. They have no class name, so record them
# under a synthetic key that only feeds the unicode list, not the CSS.
for cp in sorted(raw_codepoints):
    n = int(cp, 16)
    fam = "brand" if n in cmaps["brand"] else "solid" if n in cmaps["solid"] else None
    if fam is None:
        print(f"    WARNING: raw codepoint U+{cp.upper()} not in either font")
        continue
    if cp not in split[fam].values():
        split[fam][f"raw-{cp}"] = cp

print(f"    {len(split['solid'])} solid, {len(split['brand'])} brand")
if unknown:
    # Custom icons such as fa-xhs are defined in icons.css, not Font Awesome.
    print(f"    not in Font Awesome (expected for custom icons): {sorted(set(unknown))}")

json.dump(split, open(os.path.join(work, "split.json"), "w"))
for fam in ("solid", "brand"):
    codes = ",".join("U+" + cp for cp in sorted(split[fam].values()))
    open(os.path.join(work, f"{fam}.unicodes"), "w").write(codes)
PY

echo "==> Subsetting fonts"
mkdir -p "$ROOT/static/webfonts"
for pair in "solid:fa-solid-900" "brand:fa-brands-400"; do
  fam="${pair%%:*}"; src="${pair##*:}"
  pyftsubset "$WORK/$src.woff2" \
    --unicodes-file="$WORK/$fam.unicodes" \
    --flavor=woff2 --layout-features='' --no-hinting --desubroutinize \
    --output-file="$ROOT/static/webfonts/$src.woff2"
  before=$(stat -f%z "$WORK/$src.woff2")
  after=$(stat -f%z "$ROOT/static/webfonts/$src.woff2")
  python3 -c "print(f'    $src.woff2: {$before/1024:.1f} KB -> {$after/1024:.1f} KB')"
done

echo "==> Verifying every glyph survived"
python3 - "$ROOT" "$WORK" <<'PY'
import json, os, sys
from fontTools.ttLib import TTFont

root, work = sys.argv[1], sys.argv[2]
split = json.load(open(os.path.join(work, "split.json")))
failed = False
for fam, path in (("solid", "fa-solid-900.woff2"), ("brand", "fa-brands-400.woff2")):
    font = TTFont(os.path.join(root, "static/webfonts", path))
    chars, blank = set(), []
    for table in font["cmap"].tables:
        chars |= set(table.cmap.keys())
    glyf = font["glyf"] if "glyf" in font else None
    for table in font["cmap"].tables:
        for cp, name in table.cmap.items():
            if glyf is not None and glyf[name].numberOfContours == 0:
                blank.append(name)
    for icon, cp in split[fam].items():
        if int(cp, 16) not in chars:
            print(f"    MISSING {icon} U+{cp.upper()}")
            failed = True
    if blank:
        print(f"    BLANK OUTLINES in {path}: {sorted(set(blank))[:5]}")
        failed = True
if failed:
    sys.exit("Subset is missing glyphs; aborting.")
print("    all glyphs present with outlines")
PY

echo "==> Checking the stylesheet matches the fonts"
python3 - "$ROOT" "$WORK" <<'PY'
import json, os, re, sys

root, work = sys.argv[1], sys.argv[2]
split = json.load(open(os.path.join(work, "split.json")))
css_path = os.path.join(root, "static/stylesheets/fontawesome-subset.css")
css = open(css_path, encoding="utf-8").read()

declared = {m.group(1): m.group(2).lower()
            for m in re.finditer(r'\.(fa-[a-z0-9-]+)::before\s*\{\s*content:\s*"\\([0-9a-f]+)"', css)}
wanted = {k: v.lower() for fam in split.values() for k, v in fam.items()
          if not k.startswith("raw-")}

missing = {k: v for k, v in wanted.items() if k not in declared}
extra = {k: v for k, v in declared.items() if k not in wanted}
wrong = {k: (declared[k], v) for k, v in wanted.items()
         if k in declared and declared[k] != v}

if missing:
    print(f"    stylesheet is MISSING rules for: {sorted(missing)}")
if extra:
    print(f"    stylesheet declares unused icons: {sorted(extra)}")
if wrong:
    print(f"    codepoint mismatches: {wrong}")
if missing or wrong:
    sys.exit("Stylesheet and fonts disagree; fix fontawesome-subset.css.")
print(f"    {len(declared)} glyph rules, consistent with the subset fonts")
PY

echo "==> Subsetting Academicons"
python3 - "$ROOT" "$WORK" <<'PY'
import json, os, re, sys
from fontTools.ttLib import TTFont

root, work = sys.argv[1], sys.argv[2]

# Which ai-* classes are used, and which of them actually need the webfont —
# most institutional logos are custom SVG masks in icons.css, which loads after
# this stylesheet and wins.
used = set()
for base, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if not d.startswith((".", "_", "node_modules"))]
    for name in files:
        if not name.endswith((".html", ".js")) or name.startswith("_"):
            continue
        text = open(os.path.join(base, name), encoding="utf-8").read()
        for pat in (r'class="([^"]*)"',
                    r'''class(?:Name)?\s*=\s*['"]([^'"]*)['"]'''):
            for m in re.finditer(pat, text):
                used.update(m.group(1).split())

upstream = open(os.path.join(root, "static/stylesheets/css/academicons.min.css"),
                encoding="utf-8").read()
custom = set(re.findall(r"\.(ai-[a-z0-9-]+)",
             open(os.path.join(root, "static/stylesheets/icons.css"),
                  encoding="utf-8").read()))

wanted = {}
for cls in sorted(c for c in used if re.fullmatch(r"ai-[a-z0-9-]+", c)):
    if cls in custom:
        continue  # drawn by an SVG mask, no glyph needed
    m = re.search(r"\." + re.escape(cls) + r":before\s*\{\s*content:\s*\"\\([0-9a-f]+)\"",
                  upstream)
    if m:
        wanted[cls] = m.group(1)

print(f"    {len(wanted)} glyphs needed: {sorted(wanted)}")
json.dump(wanted, open(os.path.join(work, "ai.json"), "w"))
open(os.path.join(work, "ai.unicodes"), "w").write(
    ",".join("U+" + cp for cp in sorted(wanted.values())))
PY

pyftsubset "$ROOT/static/stylesheets/fonts/academicons.ttf" \
  --unicodes-file="$WORK/ai.unicodes" \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize \
  --output-file="$ROOT/static/webfonts/academicons.woff2" 2>/dev/null
python3 -c "
import os,sys
o=os.path.getsize('$ROOT/static/stylesheets/fonts/academicons.woff')
n=os.path.getsize('$ROOT/static/webfonts/academicons.woff2')
print(f'    academicons: {o/1024:.1f} KB woff -> {n/1024:.1f} KB woff2')"

python3 - "$ROOT" "$WORK" <<'PY'
import json, os, sys
from fontTools.ttLib import TTFont

root, work = sys.argv[1], sys.argv[2]
wanted = json.load(open(os.path.join(work, "ai.json")))
font = TTFont(os.path.join(root, "static/webfonts/academicons.woff2"))
chars = set()
for table in font["cmap"].tables:
    chars |= set(table.cmap.keys())

css = open(os.path.join(root, "static/stylesheets/academicons-subset.css"),
           encoding="utf-8").read()
import re
declared = {m.group(1): m.group(2).lower() for m in
            re.finditer(r'\.(ai-[a-z0-9-]+)::before\s*\{\s*content:\s*"\\([0-9a-f]+)"', css)}

failed = False
for cls, cp in wanted.items():
    if int(cp, 16) not in chars:
        print(f"    MISSING glyph {cls} U+{cp.upper()}")
        failed = True
    if declared.get(cls) != cp.lower():
        print(f"    stylesheet mismatch for {cls}: {declared.get(cls)} vs {cp}")
        failed = True
if failed:
    sys.exit("Academicons subset is inconsistent.")
print(f"    {len(declared)} glyph rules, consistent with the subset font")
PY

echo "==> Refreshing self-hosted Inter"
# Google serves Inter as a variable font, so one file covers every weight the
# site uses (400-700) in ~47 KB where four static faces would be ~189 KB. Ask
# with a desktop UA or the API returns older formats.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
curl -sL "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" \
  -H "User-Agent: $UA" -o "$WORK/inter.css"

python3 - "$ROOT" "$WORK" <<'PY'
import os, re, sys, urllib.request

root, work = sys.argv[1], sys.argv[2]
css = open(os.path.join(work, "inter.css"), encoding="utf-8").read()

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
targets = {"latin": "inter-latin", "latin-ext": "inter-latin-ext"}
ranges = {}

for name, out in targets.items():
    m = re.search(r"/\*\s*" + re.escape(name) + r"\s*\*/\s*@font-face\s*\{(.*?)\}",
                  css, re.S)
    if not m:
        sys.exit(f"Could not find the {name} @font-face block.")
    body = m.group(1)
    ranges[name] = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
    url = re.search(r"url\((https://[^)]+)\)", body).group(1)
    data = urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA})).read()
    dest = os.path.join(root, "static/webfonts", out + ".woff2")
    open(dest, "wb").write(data)
    print(f"    {out}.woff2: {len(data)/1024:.1f} KB")

# Keep the stylesheet's unicode-range in step with whatever upstream now serves.
sheet = os.path.join(root, "static/stylesheets/inter.css")
text = open(sheet, encoding="utf-8").read()
for name, out in targets.items():
    pattern = re.compile(
        r'(src: url\("/static/webfonts/' + re.escape(out) +
        r'\.woff2[^"]*"\) format\("woff2"\);\n\s*unicode-range:\s*)([^;]+)(;)')
    if not pattern.search(text):
        sys.exit(f"Could not locate the {out} rule in inter.css.")
    text = pattern.sub(lambda m: m.group(1) + ranges[name] + m.group(3), text)
open(sheet, "w", encoding="utf-8").write(text)
print("    inter.css unicode-ranges in sync with upstream")
PY

echo
echo "Done."
