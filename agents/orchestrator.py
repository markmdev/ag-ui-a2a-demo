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
    model="gemini-2.5-flash",
    instruction="""
    You are a helpful assistant. Please delegate as needed.
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
