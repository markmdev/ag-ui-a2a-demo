"""
Itinerary Agent (LangGraph + A2A Protocol)

This agent creates day-by-day travel itineraries using LangGraph.
It exposes an A2A Protocol endpoint so it can be called by the orchestrator.
"""

import uvicorn
import json
import os
from dotenv import load_dotenv

load_dotenv()

# A2A Protocol imports
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
    Message
)
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message

# LangGraph imports
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import operator


# Define the state for our LangGraph agent
class ItineraryState(TypedDict):
    destination: str
    days: int
    message: str
    itinerary: str


class ItineraryAgent:
    """LangGraph-based itinerary planning agent."""

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        self.graph = self._build_graph()

    def _build_graph(self):
        """Build the LangGraph workflow."""
        workflow = StateGraph(ItineraryState)

        # Add nodes
        workflow.add_node("parse_request", self._parse_request)
        workflow.add_node("create_itinerary", self._create_itinerary)

        # Add edges
        workflow.set_entry_point("parse_request")
        workflow.add_edge("parse_request", "create_itinerary")
        workflow.add_edge("create_itinerary", END)

        return workflow.compile()

    def _parse_request(self, state: ItineraryState) -> ItineraryState:
        """Parse the user's travel request to extract destination and duration."""
        message = state["message"]

        # Use LLM to extract structured info
        prompt = f"""
        Extract the destination and number of days from this travel request.
        Return ONLY a JSON object with 'destination' and 'days' fields.

        Request: {message}

        Example output: {{"destination": "Tokyo", "days": 3}}
        """

        response = self.llm.invoke(prompt)

        try:
            parsed = json.loads(response.content)
            state["destination"] = parsed.get("destination", "Unknown")
            state["days"] = int(parsed.get("days", 3))
        except:
            state["destination"] = "Unknown"
            state["days"] = 3

        return state

    def _create_itinerary(self, state: ItineraryState) -> ItineraryState:
        """Generate a day-by-day itinerary."""
        destination = state["destination"]
        days = state["days"]

        prompt = f"""
        Create a detailed {days}-day travel itinerary for {destination}.

        Return ONLY a JSON object with this structure:
        {{
            "destination": "{destination}",
            "days": {days},
            "daily_plans": [
                {{
                    "day": 1,
                    "title": "Day title",
                    "activities": ["Activity 1", "Activity 2", "Activity 3"],
                    "meals": {{"breakfast": "Place", "lunch": "Place", "dinner": "Place"}}
                }}
            ]
        }}

        Make it realistic and interesting.
        """

        response = self.llm.invoke(prompt)
        state["itinerary"] = response.content

        return state

    async def invoke(self, message: Message) -> str:
        """Process an incoming A2A message and return an itinerary."""
        # Extract the text from the A2A message
        message_text = message.parts[0].root.text

        # Run the LangGraph workflow
        result = self.graph.invoke({
            "message": message_text,
            "destination": "",
            "days": 3,
            "itinerary": ""
        })

        return result["itinerary"]


# Define the A2A agent card
port = int(os.getenv("ITINERARY_PORT", 9001))

skill = AgentSkill(
    id='itinerary_agent',
    name='Itinerary Planning Agent',
    description='Creates detailed day-by-day travel itineraries using LangGraph',
    tags=['travel', 'itinerary', 'langgraph'],
    examples=[
        'Create a 3-day itinerary for Tokyo',
        'Plan a week-long trip to Paris',
        'What should I do in New York for 5 days?'
    ],
)

public_agent_card = AgentCard(
    name='Itinerary Agent',
    description='LangGraph-powered agent that creates detailed travel itineraries',
    url=f'http://localhost:{port}/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=False,
)


class ItineraryAgentExecutor(AgentExecutor):
    """A2A Protocol executor for the Itinerary Agent."""

    def __init__(self):
        self.agent = ItineraryAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """Execute the agent and send results back via A2A Protocol."""
        result = await self.agent.invoke(context.message)
        await event_queue.enqueue_event(new_agent_text_message(result))

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        raise Exception('cancel not supported')


def main():
    # Check for required API key
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Warning: OPENAI_API_KEY environment variable not set!")
        print("   Set it with: export OPENAI_API_KEY='your-key-here'")
        print()

    # Create the A2A server
    request_handler = DefaultRequestHandler(
        agent_executor=ItineraryAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    print(f"🗺️  Starting Itinerary Agent (LangGraph + A2A) on http://localhost:{port}")
    uvicorn.run(server.build(), host='0.0.0.0', port=port)


if __name__ == '__main__':
    main()
