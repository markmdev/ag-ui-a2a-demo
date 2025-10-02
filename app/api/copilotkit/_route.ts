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
  const buildings_management_agent_url =
    process.env.buildings_management || "http://localhost:9001";
  const finance_url = process.env.finance || "http://localhost:9002";
  const it_url = process.env.it || "http://localhost:9003";

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
    description: "Middleware that connects to remote A2A agents",
    // The orchestrator agent (speaks AG-UI Protocol)
    orchestrationAgent,
    // The A2A agent URLs (speak A2A Protocol)
    agentUrls: [buildings_management_agent_url, finance_url, it_url],
    // Simple domain-specific instructions only
    // The middleware adds comprehensive routing instructions automatically
    instructions: `
        You are an HR agent. You are responsible for hiring employees and other typical HR tasks.

          It's very important to contact all the departments necessary to complete the task.
          For example, to hire an employee, you must contact all 3 departments: Finance, IT and Buildings Management. Help the Buildings Management department to find a table.

          You can make tool calls on behalf of other agents.
          DO NOT FORGET TO COMMUNICATE BACK TO THE RELEVANT AGENT IF MAKING A TOOL CALL ON BEHALF OF ANOTHER AGENT!!!

          When choosing a seat with the buildings management agent, You MUST use the \`pickTable\` tool to have the user pick a seat.
          The buildings management agent will then use the \`pickSeat\` tool to pick a seat.
      `,
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
