/**
 * CopilotKit API Route with A2A Middleware
 *
 * This route sets up the connection between:
 * 1. The Next.js frontend (using CopilotKit)
 * 2. The A2A Middleware (which wraps the orchestrator)
 * 3. The orchestrator agent (ADK agent via AG-UI Protocol)
 * 4. The A2A agents (Itinerary and Budget agents)
 */

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
// Using our fixed version of A2A Middleware that properly handles tool result context
import { A2AMiddlewareAgent as A2AMiddlewareAgent } from "@/lib/a2a-middleware";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // A2A agent URLs (the specialized agents using A2A Protocol)
  // LangGraph Agent
  const itineraryAgentUrl = process.env.ITINERARY_AGENT_URL || "http://localhost:9001";

  // ADK Agents (Python + Gemini)
  const budgetAgentUrl = process.env.BUDGET_AGENT_URL || "http://localhost:9002";
  const restaurantAgentUrl = process.env.RESTAURANT_AGENT_URL || "http://localhost:9003";
  const weatherAgentUrl = process.env.WEATHER_AGENT_URL || "http://localhost:9005";

  // Orchestrator agent URL (ADK agent using AG-UI Protocol)
  const orchestratorUrl = process.env.ORCHESTRATOR_URL || "http://localhost:9000";

  // Create an HttpAgent that wraps the orchestrator
  // This agent speaks AG-UI Protocol
  const orchestrationAgent = new HttpAgent({
    url: orchestratorUrl,
  });

  // Create the A2A Middleware Agent
  // This agent wraps the orchestrator and connects it to the A2A agents
  // It automatically adds the send_message_to_a2a_agent tool to the orchestrator
  const a2aMiddlewareAgent = new A2AMiddlewareAgent({
    description:
      "Travel planning assistant with 4 specialized agents: Itinerary and Restaurant (LangGraph), Weather and Budget (ADK)",
    // The A2A agent URLs (speak A2A Protocol)
    // Register 4 agents: 2 LangGraph + 2 ADK
    agentUrls: [
      // LangGraph agents
      itineraryAgentUrl,
      restaurantAgentUrl,
      // ADK agents
      budgetAgentUrl,
      weatherAgentUrl,
    ],
    // The orchestrator agent (speaks AG-UI Protocol)
    orchestrationAgent,
    // Simple domain-specific instructions only
    // The middleware adds comprehensive routing instructions automatically
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
    // instructions: `
    //     You are an HR agent. You are responsible for hiring employees and other typical HR tasks.

    //       It's very important to contact all the departments necessary to complete the task.
    //       For example, to hire an employee, you must contact all 3 departments: Finance, IT and Buildings Management. Help the Buildings Management department to find a table.

    //       You can make tool calls on behalf of other agents.
    //       DO NOT FORGET TO COMMUNICATE BACK TO THE RELEVANT AGENT IF MAKING A TOOL CALL ON BEHALF OF ANOTHER AGENT!!!

    //       When choosing a seat with the buildings management agent, You MUST use the \`pickTable\` tool to have the user pick a seat.
    //       The buildings management agent will then use the \`pickSeat\` tool to pick a seat.
    //   `,
    debug: true, // Enable debug logging
  });

  // Create the CopilotKit runtime with our A2A middleware agent
  // The key "travel_planner" is the agent name that will be used in the UI
  const runtime = new CopilotRuntime({
    agents: {
      a2a_chat: a2aMiddlewareAgent,
    },
  });

  // Set up the Next.js endpoint handler
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(request);
}
