"""
Budget Agent (ADK + A2A Protocol)

This agent estimates travel costs and creates budgets using Google ADK.
It exposes an A2A Protocol endpoint so it can be called by the orchestrator.
"""

import uvicorn
import os
from typing import Any, AsyncIterable
from dotenv import load_dotenv

load_dotenv()

# A2A Protocol imports
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore, TaskUpdater
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
    Message,
    TaskState,
    Part,
    TextPart
)
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import (
    new_agent_text_message,
    new_agent_parts_message,
    new_task
)

# Google ADK imports
from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.artifacts import InMemoryArtifactService
from google.genai import types


class BudgetAgent:
    """ADK-based budget estimation agent."""

    SUPPORTED_CONTENT_TYPES = ['text', 'text/plain']

    def __init__(self):
        # Build the ADK agent
        self._agent = self._build_agent()
        self._user_id = 'remote_agent'

        # Initialize the ADK runner with required services
        self._runner = Runner(
            app_name=self._agent.name,
            agent=self._agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

    def get_processing_message(self) -> str:
        """Return a message to display while processing."""
        return 'Analyzing travel requirements and calculating budget estimates...'

    def _build_agent(self) -> LlmAgent:
        """Build the LLM agent for budget estimation using ADK."""
        # Use native Gemini model directly (better performance than LiteLLM)
        # Match the orchestrator model for consistency
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

        return LlmAgent(
            model=model_name,  # Direct model string, no LiteLlm wrapper needed
            name='budget_agent',
            description='An agent that estimates travel costs and creates detailed budget breakdowns',
            instruction="""
You are a travel budget planning agent. Your role is to estimate realistic travel budgets based on user requests.

When you receive a travel request, analyze the destination, duration, and any other details provided.
Then create a detailed budget breakdown with the following structure:

{
    "total_budget": <total amount in numbers>,
    "currency": "USD",
    "per_person": true/false,
    "breakdown": [
        {"category": "Accommodation", "amount": <amount>, "percentage": <percentage>},
        {"category": "Food", "amount": <amount>, "percentage": <percentage>},
        {"category": "Transportation", "amount": <amount>, "percentage": <percentage>},
        {"category": "Activities", "amount": <amount>, "percentage": <percentage>},
        {"category": "Miscellaneous", "amount": <amount>, "percentage": <percentage>}
    ],
    "notes": "<brief explanation of the budget estimate>"
}

Make realistic estimates based on:
- The destination (cost of living in that location)
- Duration of the trip
- Type of travel (budget, mid-range, luxury if specified)
- Number of people if mentioned
- Any specific activities or requirements mentioned

 CRITICAL: Return ONLY a JSON string representing the itinerary, no markdown, no explanation, no extra text.
            """,
            tools=[],  # No tools needed for this agent currently
        )

    async def stream(self, query: str, session_id: str) -> AsyncIterable[dict[str, Any]]:
        """
        Stream budget estimation results using ADK runner.

        Args:
            query: The user's travel budget request
            session_id: Session ID for conversation continuity

        Yields:
            dict: Events with 'is_task_complete' and either 'content' or 'updates'
        """
        # Get or create session
        session = await self._runner.session_service.get_session(
            app_name=self._agent.name,
            user_id=self._user_id,
            session_id=session_id,
        )

        # Create content object for the query
        content = types.Content(
            role='user', parts=[types.Part.from_text(text=query)]
        )

        # Create session if it doesn't exist
        if session is None:
            session = await self._runner.session_service.create_session(
                app_name=self._agent.name,
                user_id=self._user_id,
                state={},
                session_id=session_id,
            )

        # Run the agent and stream results
        async for event in self._runner.run_async(
            user_id=self._user_id,
            session_id=session.id,
            new_message=content
        ):
            # Check if this is the final response
            if event.is_final_response():
                response = ''
                if (
                    event.content
                    and event.content.parts
                    and event.content.parts[0].text
                ):
                    # Extract text from all parts
                    response = '\n'.join(
                        [p.text for p in event.content.parts if p.text]
                    )

                yield {
                    'is_task_complete': True,
                    'content': response,
                }
            else:
                # Intermediate processing event
                yield {
                    'is_task_complete': False,
                    'updates': self.get_processing_message(),
                }


# Define the A2A agent card
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
    """A2A Protocol executor for the Budget Agent using ADK streaming."""

    def __init__(self):
        self.agent = BudgetAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """
        Execute the agent and stream results back via A2A Protocol.

        This method handles the streaming events from the ADK agent and
        translates them into A2A Protocol events for the task.
        """
        # Extract the user's query from the context
        query = context.get_user_input()
        task = context.current_task

        # Create a new task if one doesn't exist
        # This allows us to track status updates during processing
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)

        # Create a task updater to manage task status
        updater = TaskUpdater(event_queue, task.id, task.context_id)

        # Stream events from the ADK agent
        async for item in self.agent.stream(query, task.context_id):
            is_task_complete = item['is_task_complete']

            if not is_task_complete:
                # Send intermediate status update
                await updater.update_status(
                    TaskState.working,
                    new_agent_text_message(
                        item['updates'], task.context_id, task.id
                    ),
                )
                continue

            # Task is complete - send the final result
            content = item['content']

            # Add the response as an artifact
            await updater.add_artifact(
                [Part(root=TextPart(text=content))],
                name='budget_estimate'
            )

            # Mark task as complete
            await updater.complete()
            break

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        """Cancel is not currently supported for this agent."""
        raise Exception('cancel not supported')


def main():
    # Check for required API key (ADK/LiteLLM will handle authentication)
    # Support both GOOGLE_API_KEY and GEMINI_API_KEY for compatibility
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        print("⚠️  Warning: No API key found!")
        print("   Set either GOOGLE_API_KEY or GEMINI_API_KEY environment variable")
        print("   Example: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://aistudio.google.com/app/apikey")
        print()

    # Create the A2A server with the budget agent executor
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
