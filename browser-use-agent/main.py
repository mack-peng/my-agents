import asyncio
import os
from browser_use import Agent
from browser_use.llm import ChatDeepSeek


async def main():
    agent = Agent(
        task="在 Google 搜索中，网站结果会显示网站名称（site name）。请找到：1）Google 搜索结果中网站名称的显示方式和 SEO 写法规范；2）Google 官方关于此功能的帮助文档链接。用中文回答，列出具体要点和官方文档链接。",
        llm=ChatDeepSeek(api_key=os.environ["DEEPSEEK_API_KEY"]),
        max_actions_per_step=1,
        use_vision=False,
    )
    result = await agent.run()
    print(result)


asyncio.run(main())
