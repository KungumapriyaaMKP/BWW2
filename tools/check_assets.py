import re
import os

html = open('index.html', encoding='utf-8').read()
srcs = re.findall(r'(?:src|href|poster)="([^"]+)"', html)
missing_html = []
for s in srcs:
    if s.startswith(('http://', 'https://', '#', 'mailto:', 'tel:')):
        continue
    clean_s = s.split('?')[0].split('#')[0]
    if not os.path.exists(clean_s):
        missing_html.append(clean_s)

print('Missing HTML references:', missing_html)

css = open('css/style.css', encoding='utf-8').read()
urls = re.findall(r'url\(["\']?([^"\')]+)["\']?\)', css)
missing_css = []
for u in urls:
    if u.startswith(('http://', 'https://', 'data:')):
        continue
    clean_u = u.split('?')[0].split('#')[0]
    target = os.path.normpath(os.path.join('css', clean_u))
    if not os.path.exists(target):
        missing_css.append((clean_u, target))

print('Missing CSS references:', missing_css)

js = open('js/script.js', encoding='utf-8').read()
js_urls = re.findall(r'["\']([^"\']+\.(?:webp|jpg|png|mp3|mp4|json))["\']', js)
missing_js = []
for j in js_urls:
    if j.startswith(('http://', 'https://')):
        continue
    clean_j = j.split('?')[0].split('#')[0]
    if not os.path.exists(clean_j):
        missing_js.append(clean_j)

print('Missing JS references:', missing_js)
