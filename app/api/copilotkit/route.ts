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
import { A2AMiddlewareAgent } from "@ag-ui/a2a-middleware";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // A2A agent URLs (the specialized agents using A2A Protocol)
  const itineraryAgentUrl = process.env.ITINERARY_AGENT_URL || "http://localhost:9001";
  const budgetAgentUrl = process.env.BUDGET_AGENT_URL || "http://localhost:9002";

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
    description: "Travel planning assistant with itinerary and budget agents",
    // The A2A agent URLs (speak A2A Protocol)
    agentUrls: [itineraryAgentUrl, budgetAgentUrl],
    // The orchestrator agent (speaks AG-UI Protocol)
    orchestrationAgent,
    // Simple domain-specific instructions only
    // The middleware adds comprehensive routing instructions automatically
    instructions: `
      You are a travel planning assistant.

      When a user wants to plan a trip:
      - Use the Itinerary Agent to create detailed day-by-day itineraries
      - Use the Budget Agent to estimate travel costs

      Always present results to the user in a clear, friendly way.
    `,
    debug: true, // Enable debug logging
  });

  // Create the CopilotKit runtime with our A2A middleware agent
  // The key "travel_planner" is the agent name that will be used in the UI
  const runtime = new CopilotRuntime({
    agents: {
      travel_planner: a2aMiddlewareAgent,
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
