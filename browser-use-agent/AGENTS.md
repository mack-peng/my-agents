# Browser Use Agent

Thin wrapper: `browser-use` + DeepSeek LLM. I run browser tasks for you.

## Workflow

1. Tell me a browser goal (e.g. "搜索 Strikingly 并返回官网链接")
2. I write the agent code, run it, return the result

## Key facts (for me, internal)

- Python 3.13 via `uv`; `.venv` pre-populated
- Dependencies: `browser-use>=0.12.9` (add with `uv add <pkg>`)
- LLM: DeepSeek via `DEEPSEEK_API_KEY` env var
- Agent API: `from browser_use import Agent; from browser_use.llm import ChatDeepSeek`

Just tell me what you want me to do in the browser.
