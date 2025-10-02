"""
Weather Agent (ADK + A2A Protocol)

This agent provides weather forecasts and travel weather advice.
It exposes an A2A Protocol endpoint and can be called by the orchestrator.

Features:
- Provides weather forecasts for travel destinations
- Returns structured JSON with weather predictions
- Helps travelers plan activities based on weather conditions
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


# Pydantic models for structured weather output
class DailyWeather(BaseModel):
    """Structured data for daily weather forecast."""
    day: int = Field(description="Day number")
    date: str = Field(description="Date (e.g., 'Dec 15')")
    condition: str = Field(description="Weather condition (e.g., 'Sunny', 'Rainy', 'Cloudy')")
    highTemp: int = Field(description="High temperature in Fahrenheit")
    lowTemp: int = Field(description="Low temperature in Fahrenheit")
    precipitation: int = Field(description="Chance of precipitation as percentage")
    humidity: int = Field(description="Humidity percentage")
    windSpeed: int = Field(description="Wind speed in mph")
    description: str = Field(description="Detailed weather description")


class StructuredWeather(BaseModel):
    """Complete structured weather forecast output."""
    destination: str = Field(description="Destination city/location")
    forecast: List[DailyWeather] = Field(description="Daily weather forecasts")
    travelAdvice: str = Field(description="Weather-based travel advice and what to pack")
    bestDays: List[int] = Field(description="Best days for outdoor activities based on weather")


class WeatherAgent:
    """ADK-based weather forecast agent."""

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
        return 'Checking weather forecasts and travel conditions...'

    def _build_agent(self) -> LlmAgent:
        """Build the LLM agent for weather forecasting using ADK."""
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

        return LlmAgent(
            model=model_name,
            name='weather_agent',
            description='An agent that provides weather forecasts and travel weather advice',
            instruction="""
You are a weather forecast agent for travelers. Your role is to provide realistic weather
predictions and help travelers prepare for weather conditions.

When you receive a request, analyze:
- The destination city/location
- Travel dates or trip duration
- Any specific weather concerns mentioned

Return ONLY a valid JSON object with this exact structure:
{
  "destination": "City Name",
  "forecast": [
    {
      "day": 1,
      "date": "Dec 15",
      "condition": "Sunny",
      "highTemp": 75,
      "lowTemp": 60,
      "precipitation": 10,
      "humidity": 45,
      "windSpeed": 8,
      "description": "Clear skies with pleasant temperatures, perfect for sightseeing"
    }
  ],
  "travelAdvice": "Pack light layers, sunscreen, and comfortable walking shoes. Evenings may be cool, so bring a light jacket.",
  "bestDays": [1, 3, 5]
}

Provide weather forecasts based on:
- Typical weather patterns for that destination and season
- Realistic temperature ranges
- Appropriate precipitation chances
- Helpful packing advice
- Identification of best days for outdoor activities

Make forecasts realistic for the destination's climate and current season.
Include helpful travel advice based on the weather conditions.

Return ONLY valid JSON, no markdown code blocks, no other text.
            """,
            tools=[],  # No tools needed for this agent
        )

    async def stream(self, query: str, session_id: str) -> AsyncIterable[dict[str, Any]]:
        """
        Stream weather forecast results using ADK runner.

        Args:
            query: The user's weather request (includes destination and dates)
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
                    validated_weather = StructuredWeather(**structured_data)

                    # Return JSON string
                    final_response = json.dumps(validated_weather.model_dump(), indent=2)
                    print("✅ Successfully created structured weather forecast")
                except json.JSONDecodeError as e:
                    print(f"❌ JSON parsing error: {e}")
                    print(f"Content: {content_str}")
                    # Fallback
                    final_response = json.dumps({
                        "error": "Failed to generate structured weather forecast",
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
port = int(os.getenv("WEATHER_PORT", 9005))

skill = AgentSkill(
    id='weather_agent',
    name='Weather Forecast Agent',
    description='Provides weather forecasts and travel weather advice using ADK',
    tags=['travel', 'weather', 'forecast', 'climate', 'adk'],
    examples=[
        'What will the weather be like in Tokyo next week?',
        'Should I pack an umbrella for my Paris trip?',
        'Give me the weather forecast for my 5-day New York visit'
    ],
)

public_agent_card = AgentCard(
    name='Weather Agent',
    description='ADK-powered agent that provides weather forecasts and packing advice for travelers',
    url=f'http://localhost:{port}/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class WeatherAgentExecutor(AgentExecutor):
    """A2A Protocol executor for the Weather Agent using ADK streaming."""

    def __init__(self):
        self.agent = WeatherAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """
        Execute the agent and send results back via A2A Protocol.

        This agent is called by the orchestrator to provide weather forecasts
        that help plan travel activities.
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

    # Create the A2A server with the weather agent executor
    request_handler = DefaultRequestHandler(
        agent_executor=WeatherAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"🌤️  Starting Weather Agent (ADK + A2A) on http://localhost:{port}")
    print(f"   Agent: {public_agent_card.name}")
    print(f"   Description: {public_agent_card.description}")
    uvicorn.run(server.build(), host='0.0.0.0', port=port)


if __name__ == '__main__':
    main()
