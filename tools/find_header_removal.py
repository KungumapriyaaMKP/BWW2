import json

with open(r'C:\Users\Hp\.gemini\antigravity\brain\afc3b2f3-c24d-4ead-b5f9-4cc586e1ef79\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        if 'royal-header' in line or 'floating-music-btn' in line:
            obj = json.loads(line)
            print(f"Step {obj.get('step_index')}: {obj.get('type')}")
            # print calls
            tcs = obj.get('tool_calls', [])
            for tc in tcs:
                print('Tool:', tc.get('name'))
                args = tc.get('args', {})
                if 'Replacement' in args or 'Target' in args:
                    print('Target snippet:', str(args.get('Target'))[:100])
                    print('Replacement snippet:', str(args.get('Replacement'))[:100])
