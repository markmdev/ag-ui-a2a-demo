/**
 * CopilotKit API Route with A2A Middleware
 *
 * This route is the core of the multi-agent demo. It sets up the connection between:
 * 1. The Next.js frontend (using CopilotKit)
 * 2. The A2A Middleware (which wraps the orchestrator)
 * 3. The orchestrator agent (ADK agent via AG-UI Protocol)
 * 4. The A2A agents (4 specialized agents using A2A Protocol)
 *
 * ARCHITECTURE FLOW:
 * ==================
 * Frontend (CopilotKit)
 *    ↓ HTTP/WebSocket (AG-UI Protocol)
 * A2A Middleware Agent (This route)
 *    ↓ Adds send_message_to_a2a_agent tool
 * Orchestrator Agent (Port 9000)
 *    ↓ Uses send_message_to_a2a_agent tool
 * A2A Agents (Ports 9001-9005)
 *    ↓ Returns structured JSON
 * Orchestrator receives results
 *    ↓ Returns to middleware
 * Frontend renders data as generative UI
 *
 * KEY CONCEPTS:
 * =============
 * - AG-UI Protocol: Standardized agent-UI communication (CopilotKit ↔ Orchestrator)
 * - A2A Protocol: Standardized agent-to-agent communication (Orchestrator ↔ Specialized Agents)
 * - A2A Middleware: Bridges AG-UI and A2A protocols by injecting the send_message_to_a2a_agent tool
 */

// CopilotKit runtime for connecting frontend to agents
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

// AG-UI client for wrapping agents that speak AG-UI Protocol
import { HttpAgent } from "@ag-ui/client";

// A2A Middleware for connecting orchestrator to A2A agents
// Note: Using our fixed version that properly handles tool result context
import { A2AMiddlewareAgent as A2AMiddlewareAgent } from "@/lib/a2a-middleware";

import { NextRequest } from "next/server";

/**
 * POST Handler - Main API Endpoint
 *
 * This endpoint is called by CopilotKit on the frontend to communicate
 * with the agent system. It sets up the entire multi-agent architecture.
 */
export async function POST(request: NextRequest) {
  // ========================================================================
  // STEP 1: Define A2A Agent URLs
  // ========================================================================
  // These agents speak the A2A Protocol and can be called by the orchestrator
  // via the send_message_to_a2a_agent tool that the middleware provides
  // LangGraph Agent
  const itineraryAgentUrl = process.env.ITINERARY_AGENT_URL || "http://localhost:9001";

  // ADK Agents (Python + Gemini)
  const budgetAgentUrl = process.env.BUDGET_AGENT_URL || "http://localhost:9002";
  const restaurantAgentUrl = process.env.RESTAURANT_AGENT_URL || "http://localhost:9003";
  const weatherAgentUrl = process.env.WEATHER_AGENT_URL || "http://localhost:9005";

  // ========================================================================
  // STEP 2: Define Orchestrator URL
  // ========================================================================
  // The orchestrator is an ADK agent that speaks AG-UI Protocol
  // It coordinates all other agents via A2A Protocol
  const orchestratorUrl = process.env.ORCHESTRATOR_URL || "http://localhost:9000";

  // ========================================================================
  // STEP 3: Wrap Orchestrator with HttpAgent
  // ========================================================================
  // HttpAgent is an AG-UI client that connects to agents speaking AG-UI Protocol
  // It handles the HTTP communication and message formatting
  const orchestrationAgent = new HttpAgent({
    url: orchestratorUrl,
  });

  // ========================================================================
  // STEP 4: Create A2A Middleware Agent
  // ========================================================================
  // This is the magic that connects everything together!
  //
  // The A2A Middleware Agent:
  // 1. Wraps the orchestrator agent
  // 2. Automatically registers all A2A agents (via their URLs)
  // 3. Injects a send_message_to_a2a_agent tool into the orchestrator
  // 4. Intercepts calls to that tool and routes them to the appropriate A2A agent
  // 5. Returns the results back to the orchestrator
  //
  // This allows the orchestrator to communicate with A2A agents without
  // needing to know anything about the A2A Protocol!
  const a2aMiddlewareAgent = new A2AMiddlewareAgent({
    // Human-readable description of this agent system
    description:
      "Travel planning assistant with 4 specialized agents: Itinerary and Restaurant (LangGraph), Weather and Budget (ADK)",

    // Register all A2A agents by URL
    // The middleware will automatically:
    // - Fetch their agent cards to learn their capabilities
    // - Create routing logic for the orchestrator
    // - Inject the send_message_to_a2a_agent tool
    agentUrls: [
      itineraryAgentUrl,  // LangGraph + OpenAI
      restaurantAgentUrl, // ADK + Gemini
      budgetAgentUrl,     // ADK + Gemini
      weatherAgentUrl,    // ADK + Gemini
    ],

    // The orchestrator agent that will coordinate everything
    orchestrationAgent,

    // Domain-specific instructions for the orchestrator
    // Note: The middleware automatically adds comprehensive routing instructions
    // based on the registered agents' capabilities, so we only need to provide
    // workflow-specific guidance here
    instructions: `
      You are a travel planning assistant that orchestrates between 4 specialized agents.

      AVAILABLE AGENTS:

      - Itinerary Agent (LangGraph): Creates day-by-day travel itineraries with activities
      - Restaurant Agent (LangGraph): Recommends breakfast, lunch, dinner for each day
      - Weather Agent (ADK): Provides weather forecasts and packing advice
      - Budget Agent (ADK): Estimates travel costs and creates budget breakdowns

      WORKFLOW STRATEGY (SEQUENTIAL - ONE AT A TIME):

      0. **FIRST STEP - Gather Trip Requirements**:
         - Before doing ANYTHING else, call 'gather_trip_requirements' to collect essential trip information
         - Try to extract any mentioned details from the user's message (city, days, people, budget level)
         - Pass any extracted values as parameters to pre-fill the form:
           * city: Extract destination city if mentioned (e.g., "Paris", "Tokyo")
           * numberOfDays: Extract if mentioned (e.g., "5 days", "a week")
           * numberOfPeople: Extract if mentioned (e.g., "2 people", "family of 4")
           * budgetLevel: Extract if mentioned (e.g., "budget", "luxury") -> map to Economy/Comfort/Premium
         - Wait for the user to submit the complete requirements
         - Use the returned values for all subsequent agent calls

      1. Itinerary Agent - Create the base itinerary using the trip requirements
         - Pass: city, numberOfDays from trip requirements
         - The itinerary will have empty meals initially

      2. Weather Agent - Get forecast to inform planning
         - Pass: city and numberOfDays from trip requirements

      3. Restaurant Agent - Get day-by-day meal recommendations
         - Pass: city and numberOfDays from trip requirements
         - The meals will populate the itinerary display

      4. Budget Agent - Create cost estimate
         - Pass: city, numberOfDays, numberOfPeople, budgetLevel from trip requirements
         - This creates an accurate budget based on all the information

      5. **IMPORTANT**: Use 'request_budget_approval' tool for budget approval
         - Pass the budget JSON data to this tool
         - Wait for the user's decision before proceeding

      6. Present complete plan to user

      CRITICAL RULES:
      - **ALWAYS START by calling 'gather_trip_requirements' FIRST before any agent calls**
      - Call tools/agents ONE AT A TIME - never make multiple tool calls simultaneously
      - After making a tool call, WAIT for the result before making the next call
      - Pass information from trip requirements and earlier agents to later agents
      - You MUST call 'request_budget_approval' after receiving the budget
      - After receiving approval, present a complete summary to the user

      TRIP REQUIREMENTS EXTRACTION EXAMPLES:
      - "Plan a trip to Paris" -> city: "Paris"
      - "5 day trip to Tokyo for 2 people" -> city: "Tokyo", numberOfDays: 5, numberOfPeople: 2
      - "Budget vacation to Bali" -> city: "Bali", budgetLevel: "Economy"
      - "Luxury 3-day getaway for my family of 4" -> numberOfDays: 3, numberOfPeople: 4, budgetLevel: "Premium"

      Human-in-the-Loop (HITL):
      - Always gather trip requirements using 'gather_trip_requirements' at the start
      - Always request budget approval using 'request_budget_approval' after budget is created
      - Wait for user responses before proceeding

      Additional Rules:
      - Once you have received information from an agent, do not call that agent again
      - Each agent returns structured JSON - acknowledge and build on the information
      - Always provide a final response that synthesizes ALL gathered information
    `,

    // Enable debug logging (useful during development)
    debug: true,
  });

  // ========================================================================
  // STEP 5: Create CopilotKit Runtime
  // ========================================================================
  // The CopilotKit runtime manages the connection between the frontend
  // and the agent system. It handles message streaming, state management,
  // and action execution.
  const runtime = new CopilotRuntime({
    agents: {
      // Register our A2A middleware agent
      // The key "a2a_chat" must match the agent prop in the frontend
      // CopilotKit component: <CopilotKit agent="a2a_chat">
      a2a_chat: a2aMiddlewareAgent,
    },
  });

  // ========================================================================
  // STEP 6: Set Up Next.js Endpoint Handler
  // ========================================================================
  // This creates the actual HTTP endpoint that the frontend will call
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(), // No LLM adapter needed (agents handle LLM calls)
    endpoint: "/api/copilotkit",
  });

  // Handle the incoming request from the frontend
  return handleRequest(request);
}
