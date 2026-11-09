with open('index.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'PATRIKAI' in line:
            print('index.html:', i+1)

with open('css/style.css', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'PATRIKAI' in line:
            print('css/style.css:', i+1)
