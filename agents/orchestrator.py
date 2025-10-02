"""
Orchestrator Agent (ADK + AG-UI Protocol)

This agent receives user requests via AG-UI Protocol and delegates tasks
to specialized A2A agents (Itinerary and Budget agents).

The A2A middleware in the frontend will wrap this agent and give it the
send_message_to_a2a_agent tool to communicate with other agents.
"""

from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import os
import uvicorn
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

# ADK imports
from google.adk.agents import LlmAgent


# Create the orchestrator agent using Google ADK
# This is a simple routing agent that will delegate to specialized agents
# Note: Using simple instructions like the working a2a-middleware example
orchestrator_agent = LlmAgent(
    name="OrchestratorAgent",
    model="gemini-2.5-pro",
    instruction="""
    You are a travel planning orchestrator agent. Your role is to coordinate specialized agents
    to create personalized travel plans.

    AVAILABLE SPECIALIZED AGENTS:

    1. **Itinerary Agent** (LangGraph) - Creates day-by-day travel itineraries with activities
    2. **Weather Agent** (ADK) - Provides weather forecasts and packing advice
    3. **Restaurant Agent** (ADK) - Recommends restaurants for breakfast, lunch, and dinner by day
    4. **Budget Agent** (ADK) - Estimates travel costs and creates budget breakdowns

    CRITICAL CONSTRAINTS:
    - You MUST call agents ONE AT A TIME, never make multiple tool calls simultaneously
    - After making a tool call, WAIT for the result before making another tool call
    - Do NOT make parallel/concurrent tool calls - this is not supported

    RECOMMENDED WORKFLOW FOR TRAVEL PLANNING:

    1. **Itinerary Agent** - Start by creating the base itinerary
       - Pass: destination, number of days, any preferences
       - Wait for structured JSON response with day-by-day activities
       - Note: Meals section will be empty initially

    2. **Weather Agent** - Get weather forecast
       - Pass: destination and number of days from itinerary
       - Wait for forecast with daily conditions and packing advice
       - This helps inform activity planning

    3. **Restaurant Agent** - Get meal recommendations
       - Pass: destination and number of days from itinerary
       - Request day-by-day meal recommendations (breakfast, lunch, dinner)
       - Wait for structured JSON with meals matching the itinerary days
       - These will populate the meals section in the itinerary display

    4. **Budget Agent** - Create comprehensive cost estimate
       - Pass: destination, duration, and all gathered information
       - Wait for detailed budget breakdown
       - This requires user approval via the request_budget_approval tool

    IMPORTANT WORKFLOW DETAILS:
    - The Itinerary Agent creates the structure but leaves meals empty
    - The Restaurant Agent fills in the meals section with specific recommendations
    - The Weather Agent provides context for outdoor activities and what to pack
    - The Budget Agent runs last and requires human-in-the-loop approval

    RESPONSE STRATEGY:
    - After each agent response, briefly acknowledge what you received
    - Build up the travel plan incrementally as you gather information
    - At the end, present a complete, well-organized travel plan
    - Don't just list agent responses - synthesize them into a cohesive plan

    IMPORTANT: Once you have received a response from an agent, do NOT call that same
    agent again for the same information. Use the information you already have.
    """,
)

# Wrap the ADK agent with AG-UI middleware
# This exposes the agent via AG-UI Protocol
adk_orchestrator_agent = ADKAgent(
    adk_agent=orchestrator_agent,
    app_name="orchestrator_app",
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True
)

# Create FastAPI app
app = FastAPI(title="Travel Planning Orchestrator (ADK)")

# Add the ADK endpoint - this creates the AG-UI Protocol endpoint at "/"
add_adk_fastapi_endpoint(app, adk_orchestrator_agent, path="/")

if __name__ == "__main__":
    # Check for required API key
    if not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  Warning: GOOGLE_API_KEY environment variable not set!")
        print("   Set it with: export GOOGLE_API_KEY='your-key-here'")
        print("   Get a key from: https://aistudio.google.com/app/apikey")
        print()

    port = int(os.getenv("ORCHESTRATOR_PORT", 9000))
    print(f"🚀 Starting Orchestrator Agent (ADK + AG-UI) on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
