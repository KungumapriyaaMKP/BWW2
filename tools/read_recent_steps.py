import json

steps = []
with open(r'C:\Users\Hp\.gemini\antigravity\brain\afc3b2f3-c24d-4ead-b5f9-4cc586e1ef79\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('type') == 'USER_INPUT':
            steps.append((obj.get('step_index'), obj.get('content')[:150]))

for s in steps[-5:]:
    print(s)
