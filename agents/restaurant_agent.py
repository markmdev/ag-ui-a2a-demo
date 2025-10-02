"""
Restaurant Agent (ADK + A2A Protocol)

This agent provides restaurant recommendations based on travel itinerary.
It exposes an A2A Protocol endpoint and can be called by other agents.

Features:
- Can be called by the orchestrator via A2A middleware
- Can be called directly by other A2A agents (peer-to-peer)
- Returns structured JSON with restaurant recommendations
"""

import uvicorn
import os
import json
from typing import Any, AsyncIterable, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

# A2A Protocol imports
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

# Google ADK imports
from google.adk.agents.llm_agent import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.artifacts import InMemoryArtifactService
from google.genai import types


# Pydantic models for structured restaurant output
class DayMeals(BaseModel):
    """Structured data for one day's meal recommendations."""
    day: int = Field(description="Day number")
    breakfast: str = Field(description="Breakfast recommendation with restaurant name and dish")
    lunch: str = Field(description="Lunch recommendation with restaurant name and dish")
    dinner: str = Field(description="Dinner recommendation with restaurant name and dish")


class StructuredRestaurants(BaseModel):
    """Complete structured restaurant recommendations output - day by day meals."""
    destination: str = Field(description="Destination city/location")
    days: int = Field(description="Number of days")
    meals: List[DayMeals] = Field(description="Day-by-day meal recommendations")


class RestaurantAgent:
    """ADK-based restaurant recommendation agent."""

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
        return 'Finding the best restaurants and dining recommendations...'

    def _build_agent(self) -> LlmAgent:
        """Build the LLM agent for restaurant recommendations using ADK."""
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

        return LlmAgent(
            model=model_name,
            name='restaurant_agent',
            description='An agent that provides restaurant and dining recommendations for travelers',
            instruction="""
You are a restaurant recommendation agent for travelers. Your role is to provide day-by-day
meal recommendations (breakfast, lunch, dinner) that match the traveler's itinerary.

When you receive a request, analyze:
- The destination city/location
- The number of days for the trip
- Any cuisine preferences or dietary needs mentioned

Return ONLY a valid JSON object with this exact structure:
{
  "destination": "City Name",
  "days": 3,
  "meals": [
    {
      "day": 1,
      "breakfast": "Café Sunrise - French pastries and coffee",
      "lunch": "Noodle House - Traditional ramen and gyoza",
      "dinner": "Skyline Restaurant - Sushi and city views"
    },
    {
      "day": 2,
      "breakfast": "Morning Market - Fresh fruit and local breakfast",
      "lunch": "Street Food Alley - Various local vendors",
      "dinner": "Family Kitchen - Home-style cooking"
    }
  ]
}

IMPORTANT RULES:
- The number of meal entries in the "meals" array MUST match the "days" field
- Each day should have breakfast, lunch, and dinner recommendations
- Include the restaurant/venue name and a brief description of the food
- Make recommendations specific to the destination's food culture
- Vary the cuisine types and price points across the days
- Consider the local dining schedule and customs

Return ONLY valid JSON, no markdown code blocks, no other text.
            """,
            tools=[],  # No tools needed for this agent
        )

    async def stream(self, query: str, session_id: str) -> AsyncIterable[dict[str, Any]]:
        """
        Stream restaurant recommendation results using ADK runner.

        Args:
            query: The user's restaurant request (may include itinerary context)
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

                # Try to parse and validate JSON response
                content_str = response_text.strip()

                # Try to extract JSON from markdown code blocks if present
                if "```json" in content_str:
                    content_str = content_str.split("```json")[1].split("```")[0].strip()
                elif "```" in content_str:
                    content_str = content_str.split("```")[1].split("```")[0].strip()

                try:
                    # Validate it's proper JSON
                    structured_data = json.loads(content_str)
                    validated_restaurants = StructuredRestaurants(**structured_data)

                    # Return JSON string
                    final_response = json.dumps(validated_restaurants.model_dump(), indent=2)
                    print("✅ Successfully created structured restaurant recommendations")
                except json.JSONDecodeError as e:
                    print(f"❌ JSON parsing error: {e}")
                    print(f"Content: {content_str}")
                    # Fallback
                    final_response = json.dumps({
                        "error": "Failed to generate structured restaurant recommendations",
                        "raw_content": content_str[:200]
                    })
                except Exception as e:
                    print(f"❌ Validation error: {e}")
                    # Fallback
                    final_response = json.dumps({
                        "error": f"Validation failed: {str(e)}"
                    })

                yield {
                    'is_task_complete': True,
                    'content': final_response,
                }
            else:
                # Intermediate processing event
                yield {
                    'is_task_complete': False,
                    'updates': self.get_processing_message(),
                }


# Define the A2A agent card
port = int(os.getenv("RESTAURANT_PORT", 9003))

skill = AgentSkill(
    id='restaurant_agent',
    name='Restaurant Recommendation Agent',
    description='Provides restaurant and dining recommendations for travelers using ADK',
    tags=['travel', 'restaurants', 'dining', 'food', 'adk'],
    examples=[
        'Recommend restaurants for my trip to Tokyo',
        'Where should I eat in Paris?',
        'Find good restaurants near my itinerary locations'
    ],
)

public_agent_card = AgentCard(
    name='Restaurant Agent',
    description='ADK-powered agent that provides personalized restaurant and dining recommendations for travelers',
    url=f'http://localhost:{port}/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class RestaurantAgentExecutor(AgentExecutor):
    """A2A Protocol executor for the Restaurant Agent using ADK streaming."""

    def __init__(self):
        self.agent = RestaurantAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """
        Execute the agent and send results back via A2A Protocol.

        This agent can be called by:
        1. The orchestrator (via A2A middleware)
        2. Other A2A agents directly (peer-to-peer communication)
        """
        # Extract the user's query from the context
        query = context.get_user_input()

        # Use a session ID from context if available, otherwise generate one
        session_id = getattr(context, 'context_id', 'default_session')

        # Stream events from the ADK agent and get the final result
        final_content = ""
        async for item in self.agent.stream(query, session_id):
            if item['is_task_complete']:
                final_content = item['content']
                break

        # Send the final result as a simple text message
        await event_queue.enqueue_event(new_agent_text_message(final_content))

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        """Cancel is not currently supported for this agent."""
        raise Exception('cancel not supported')


def main():
    # Check for required API key
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        print("⚠️  Warning: No API key found!")
        print("   Set either GOOGLE_API_KEY or GEMINI_API_KEY environment variable")
        print("   Example: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://aistudio.google.com/app/apikey")
        print()

    # Create the A2A server with the restaurant agent executor
    request_handler = DefaultRequestHandler(
        agent_executor=RestaurantAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"🍽️  Starting Restaurant Agent (ADK + A2A) on http://localhost:{port}")
    print(f"   Agent: {public_agent_card.name}")
    print(f"   Description: {public_agent_card.description}")
    uvicorn.run(server.build(), host='0.0.0.0', port=port)


if __name__ == '__main__':
    main()
