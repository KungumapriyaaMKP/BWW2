import json

with open(r'C:\Users\Hp\.gemini\antigravity\brain\afc3b2f3-c24d-4ead-b5f9-4cc586e1ef79\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('step_index') in [195, 201, 202, 207]:
            print(f"Step {obj.get('step_index')}: {obj.get('type')}")
            print(str(obj.get('content'))[:250])
            print("="*40)
