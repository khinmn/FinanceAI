import requests

api_key = 'YOUR_API_KEY_HERE'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://financeai.local',
    'X-Title': 'FinanceAI Assistant'
}

models = [
    'google/gemma-4-31b-it:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'openrouter/free',
    'openai/gpt-oss-20b:free',
    'openai/gpt-oss-120b:free',
]

for model in models:
    payload = {
        'model': model,
        'messages': [{'role': 'user', 'content': 'Say hello briefly'}],
        'max_tokens': 50,
        'temperature': 0.7
    }
    try:
        r = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=20
        )
        if r.status_code == 200:
            data = r.json()
            content = data['choices'][0]['message']['content'][:80]
            print(f'OK {model}: {content}')
        else:
            err = r.json().get('error', {}).get('message', '')[:100]
            print(f'FAIL {model}: {r.status_code} - {err}')
    except Exception as e:
        print(f'ERROR {model}: {e}')
