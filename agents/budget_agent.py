import uvicorn
import os
import json
from typing import Any, AsyncIterable, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
)
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message
from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.artifacts import InMemoryArtifactService
from google.genai import types

class BudgetCategory(BaseModel):
    category: str = Field(description="Budget category name")
    amount: float
    percentage: float

class StructuredBudget(BaseModel):
    totalBudget: float
    currency: str = "USD"
    breakdown: List[BudgetCategory]
    notes: str

class BudgetAgent:
    SUPPORTED_CONTENT_TYPES = ['text', 'text/plain']

    def __init__(self):
        self._agent = self._build_agent()
        self._user_id = 'remote_agent'
        self._runner = Runner(
            app_name=self._agent.name,
            agent=self._agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

    def get_processing_message(self) -> str:
        return 'Analyzing travel requirements and calculating budget estimates...'

    def _build_agent(self) -> LlmAgent:
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

        return LlmAgent(
            model=model_name,
            name='budget_agent',
            description='An agent that estimates travel costs and creates detailed budget breakdowns',
            instruction="""
You are a travel budget planning agent. Your role is to estimate realistic travel budgets based on user requests.

When you receive a travel request, analyze the destination, duration, and any other details provided.
Then create a detailed budget breakdown in JSON format.

Return ONLY a valid JSON object with this exact structure:
{
  "totalBudget": 5000.00,
  "currency": "USD",
  "breakdown": [
    {
      "category": "Accommodation",
      "amount": 1500.00,
      "percentage": 30.0
    },
    {
      "category": "Food & Dining",
      "amount": 1000.00,
      "percentage": 20.0
    },
    {
      "category": "Transportation",
      "amount": 800.00,
      "percentage": 16.0
    },
    {
      "category": "Activities & Attractions",
      "amount": 1200.00,
      "percentage": 24.0
    },
    {
      "category": "Miscellaneous",
      "amount": 500.00,
      "percentage": 10.0
    }
  ],
  "notes": "Budget estimate based on mid-range travel for one person. Prices reflect average costs in the destination."
}

Make realistic estimates based on:
- The destination (cost of living in that location)
- Duration of the trip
- Type of travel (budget, mid-range, luxury if specified)
- Number of people if mentioned
- Any specific activities or requirements mentioned

Return ONLY valid JSON, no markdown code blocks, no other text.
            """,
            tools=[],
        )

    async def stream(self, query: str, session_id: str) -> AsyncIterable[dict[str, Any]]:
        session = await self._runner.session_service.get_session(
            app_name=self._agent.name,
            user_id=self._user_id,
            session_id=session_id,
        )

        content = types.Content(
            role='user', parts=[types.Part.from_text(text=query)]
        )

        if session is None:
            session = await self._runner.session_service.create_session(
                app_name=self._agent.name,
                user_id=self._user_id,
                state={},
                session_id=session_id,
            )

        async for event in self._runner.run_async(
            user_id=self._user_id,
            session_id=session.id,
            new_message=content
        ):
            if event.is_final_response():
                response_text = ''
                if (
                    event.content
                    and event.content.parts
                    and event.content.parts[0].text
                ):
                    # Extract text from all parts
                    response_text = '\n'.join(
                        [p.text for p in event.content.parts if p.text]
                    )

                content_str = response_text.strip()

                if "```json" in content_str:
                    content_str = content_str.split("```json")[1].split("```")[0].strip()
                elif "```" in content_str:
                    content_str = content_str.split("```")[1].split("```")[0].strip()

                try:
                    structured_data = json.loads(content_str)
                    validated_budget = StructuredBudget(**structured_data)
                    final_response = json.dumps(validated_budget.model_dump(), indent=2)
                    print("✅ Successfully created structured budget")
                except json.JSONDecodeError as e:
                    print(f"❌ JSON parsing error: {e}")
                    final_response = json.dumps({
                        "error": "Failed to generate structured budget",
                        "raw_content": content_str[:200]
                    })
                except Exception as e:
                    print(f"❌ Validation error: {e}")
                    final_response = json.dumps({
                        "error": f"Validation failed: {str(e)}"
                    })

                yield {
                    'is_task_complete': True,
                    'content': final_response,
                }
            else:
                yield {
                    'is_task_complete': False,
                    'updates': self.get_processing_message(),
                }

port = int(os.getenv("BUDGET_PORT", 9002))

skill = AgentSkill(
    id='budget_agent',
    name='Budget Planning Agent',
    description='Estimates travel costs and creates detailed budget breakdowns using ADK',
    tags=['travel', 'budget', 'finance', 'adk'],
    examples=[
        'Estimate the budget for a 3-day trip to Tokyo',
        'How much would a week in Paris cost?',
        'Create a budget for my New York trip'
    ],
)

public_agent_card = AgentCard(
    name='Budget Agent',
    description='ADK-powered agent that estimates travel budgets and creates cost breakdowns',
    url=f'http://localhost:{port}/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)

class BudgetAgentExecutor(AgentExecutor):
    def __init__(self):
        self.agent = BudgetAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        query = context.get_user_input()
        session_id = getattr(context, 'context_id', 'default_session')
        final_content = ""
        async for item in self.agent.stream(query, session_id):
            if item['is_task_complete']:
                final_content = item['content']
                break

        await event_queue.enqueue_event(new_agent_text_message(final_content))

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise Exception('cancel not supported')

def main():
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        print("⚠️  Warning: No API key found!")
        print("   Set either GOOGLE_API_KEY or GEMINI_API_KEY environment variable")
        print("   Example: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://aistudio.google.com/app/apikey")
        print()

    request_handler = DefaultRequestHandler(
        agent_executor=BudgetAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"💰 Starting Budget Agent (ADK + A2A) on http://localhost:{port}")
    print(f"   Agent: {public_agent_card.name}")
    print(f"   Description: {public_agent_card.description}")
    uvicorn.run(server.build(), host='0.0.0.0', port=port)


if __name__ == '__main__':
    main()
