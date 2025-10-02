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
    You are a travel planning orchestrator agent. Your role is to:

    1. Receive travel planning requests from users
    2. Delegate subtasks to specialized agents (Itinerary Agent, Budget Agent) ONE AT A TIME
    3. Wait for responses from those agents (they will return structured JSON data)
    4. Synthesize the information you receive
    5. Present a comprehensive final response to the user

    CRITICAL CONSTRAINTS:
    - You MUST call agents ONE AT A TIME, never make multiple tool calls simultaneously
    - After making a tool call, WAIT for the result before making another tool call
    - Do NOT make parallel/concurrent tool calls - this is not supported

    WORKFLOW FOR TRAVEL PLANNING:
    1. First, contact the Itinerary Agent to create the day-by-day itinerary
    2. Wait for the itinerary response (it will be in JSON format)
    3. Then, contact the Budget Agent to estimate costs (pass the destination and trip duration)
    4. Wait for the budget response (it will be in JSON format)
    5. Finally, present BOTH the itinerary and budget together in a clear, user-friendly format

    AGENT RESPONSE FORMAT:
    - The Itinerary Agent returns structured JSON with: destination, days, and a detailed itinerary array
    - The Budget Agent returns structured JSON with: totalBudget, currency, breakdown by category, and notes
    - You should acknowledge receiving the data and present it to the user in a readable format

    IMPORTANT: After you receive ALL responses from the agents via tool results, you MUST
    create a final message that presents the complete information to the user. Do not just call
    the tools and stop - always follow up with a comprehensive summary.

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
