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
import { A2AMiddlewareAgent as A2AMiddlewareAgent } from "@/lib/pr-fixed";
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
    description: "Travel planning assistant with 4 specialized agents: Itinerary (LangGraph), Weather, Restaurant, and Budget (ADK)",
    // The A2A agent URLs (speak A2A Protocol)
    // Register 4 agents: 1 LangGraph + 3 ADK
    agentUrls: [
      // LangGraph agent
      itineraryAgentUrl,
      // ADK agents
      budgetAgentUrl,
      restaurantAgentUrl,
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
      - Weather Agent (ADK): Provides weather forecasts and packing advice
      - Restaurant Agent (ADK): Recommends breakfast, lunch, dinner for each day
      - Budget Agent (ADK): Estimates travel costs and creates budget breakdowns

      WORKFLOW STRATEGY (SEQUENTIAL - ONE AT A TIME):

      1. Itinerary Agent - Create the base itinerary (meals will be empty initially)
      2. Weather Agent - Get forecast to inform planning
      3. Restaurant Agent - Get day-by-day meal recommendations (pass destination + number of days)
      4. Budget Agent - Create cost estimate
      5. **IMPORTANT**: Use 'request_budget_approval' tool for budget approval
      6. Present complete plan to user

      CRITICAL RULES:
      - Call agents ONE AT A TIME - never make multiple tool calls simultaneously
      - After making a tool call, WAIT for the result before making the next call
      - Pass context from earlier agents to later ones (especially destination and days to Restaurant Agent)
      - You MUST call 'request_budget_approval' after receiving the budget
      - After receiving approval, present a complete summary to the user

      RESTAURANT AGENT SPECIFICS:
      - Must pass the destination and number of days from the itinerary
      - Request day-by-day meal recommendations (breakfast, lunch, dinner)
      - The Restaurant Agent will return meals matching the itinerary days
      - These meals will populate the itinerary display

      Human-in-the-Loop (HITL):
      - Always request budget approval using the 'request_budget_approval' tool
      - Pass the budget JSON data to this tool
      - Wait for the user's decision before proceeding

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
