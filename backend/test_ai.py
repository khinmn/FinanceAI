import requests

api_key = 'YOUR_API_KEY_HERE'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://financeai.local',
    'X-Title': 'FinanceAI Assistant'
}

# Simulate the exact prompt the Budget AI Coach sends
system_prompt = """You are FinanceAI Assistant — a friendly, practical financial guide for small and medium-sized business owners in Myanmar.
Rules: Only comment on data provided. End every response with a disclaimer. Keep language simple."""

user_prompt = """Budget and Expense Analysis for July 2026:
- Total Budgeted: K500,000.00
- Total Spent: K320,000.00
- Net Balance: K180,000.00

Category breakdown:
- Category: Office Supplies, Budget Limit: K100,000.00, Spent: K80,000.00, Status: Within limit
- Category: Marketing, Budget Limit: K200,000.00, Spent: K150,000.00, Status: Within limit
- Category: Utilities, Budget Limit: K200,000.00, Spent: K90,000.00, Status: Within limit

Please write the budget coach analysis with one short opening paragraph, a numbered list of main findings, bullet point action steps under relevant findings, and a short disclaimer paragraph."""

payload = {
    'model': 'openrouter/free',
    'messages': [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': user_prompt}
    ],
    'max_tokens': 600,
    'temperature': 0.7
}

r = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    headers=headers,
    json=payload,
    timeout=30
)
print('Status:', r.status_code)
if r.status_code == 200:
    data = r.json()
    print('Model used:', data.get('model', 'unknown'))
    print('SUCCESS! AI Response:')
    print(data['choices'][0]['message']['content'])
else:
    import json
    print('ERROR:', json.dumps(r.json(), indent=2)[:800])
