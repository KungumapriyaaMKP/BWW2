import os
import glob
import re

files = glob.glob('**/*', recursive=True)
em_dashes = []
emojis = []

for fp in files:
    if os.path.isfile(fp) and not fp.endswith(('.mp4', '.webp', '.jpg', '.png', '.ico', '.mp3', '.pdf', '.git', 'verify_build.py')):
        try:
            with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if '\u2014' in content or '&mdash;' in content:
                    em_dashes.append(fp)
                for char in content:
                    if 0x1F000 < ord(char) < 0x1FAFF:
                        emojis.append((fp, char))
        except Exception:
            pass

print('Em dash files:', em_dashes)
print('Emoji files:', emojis)

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

srcs = re.findall(r'(?:src|href)=[\'"]([^\'"]+)[\'"]', html)
missing = []
for s in srcs:
    if not s.startswith(('http', '#', 'data:')):
        norm = os.path.normpath(s)
        if not os.path.exists(norm):
            missing.append(s)

print('Missing HTML references:', missing)

with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css_urls = re.findall(r'url\([\'"]?([^\'")]+)[\'"]?\)', css)
missing_css = []
for u in css_urls:
    if not u.startswith(('http', 'data:')):
        p = os.path.normpath(os.path.join('css', u))
        if not os.path.exists(p):
            missing_css.append(u)

print('Missing CSS references:', missing_css)
