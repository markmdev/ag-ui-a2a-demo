"use client";

import React from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import type { ActionRenderProps } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

/**
 * Travel Chat Component
 *
 * This component demonstrates A2A (Agent-to-Agent) communication by:
 * 1. Visualizing messages sent TO A2A agents
 * 2. Visualizing responses FROM A2A agents
 * 3. Using color-coded badges to distinguish agent types
 */

// Type for the send_message_to_a2a_agent action parameters
type MessageActionRenderProps = ActionRenderProps<
  [
    {
      readonly name: "agentName";
      readonly type: "string";
      readonly description: "The name of the A2A agent to send the message to";
    },
    {
      readonly name: "task";
      readonly type: "string";
      readonly description: "The message to send to the A2A agent";
    },
  ]
>;

/**
 * Component to render outgoing messages TO A2A agents
 */
const MessageToA2A = ({ status, args }: MessageActionRenderProps) => {
  // Use switch statement like dojo example for clarity
  switch (status) {
    case "executing":
    case "complete":
      // Message is active, render it
      break;
    default:
      return null;
  }

  // Determine agent color based on agent name
  const getAgentColor = (agentName: string) => {
    if (agentName.toLowerCase().includes("itinerary")) {
      return "bg-purple-100 text-purple-700 border-purple-300";
    }
    if (agentName.toLowerCase().includes("budget")) {
      return "bg-blue-100 text-blue-700 border-blue-300";
    }
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 my-2 a2a-message-enter">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">
            Orchestrator
          </span>
          <span className="text-gray-400 text-sm">→</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getAgentColor(args.agentName)}`}
          >
            {args.agentName}
          </span>
        </div>
        <span className="text-gray-700 text-sm flex-1">{args.task}</span>
      </div>
    </div>
  );
};

/**
 * Component to render incoming responses FROM A2A agents
 */
const MessageFromA2A = ({ status, args, result }: MessageActionRenderProps) => {
  // Use switch statement like dojo example for clarity
  switch (status) {
    case "complete":
      // Only render if we have a result
      if (!result) return null;
      break;
    default:
      return null;
  }

  // Determine agent color based on agent name
  const getAgentColor = (agentName: string) => {
    if (agentName.toLowerCase().includes("itinerary")) {
      return "bg-purple-100 text-purple-700 border-purple-300";
    }
    if (agentName.toLowerCase().includes("budget")) {
      return "bg-blue-100 text-blue-700 border-blue-300";
    }
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  // Try to parse and prettify JSON responses
  const formatResult = (result: string) => {
    try {
      const parsed = JSON.parse(result);
      return (
        <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-w-full">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-sm">{result}</span>;
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 my-2 a2a-message-enter">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 min-w-[200px] flex-shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getAgentColor(args.agentName)}`}
          >
            {args.agentName}
          </span>
          <span className="text-gray-400 text-sm">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">
            Orchestrator
          </span>
        </div>
        <div className="text-gray-700 flex-1">{formatResult(result)}</div>
      </div>
    </div>
  );
};

/**
 * Inner chat component that uses CopilotKit hooks
 */
const ChatInner = () => {
  // Register the action renderer for A2A messages
  // This is called automatically by the A2A middleware when agents communicate
  useCopilotAction({
    name: "send_message_to_a2a_agent",
    description: "Sends a message to an A2A agent",
    available: "frontend", // This action is only rendered on frontend, not executed
    parameters: [
      {
        name: "agentName",
        type: "string",
        description: "The name of the A2A agent to send the message to",
      },
      {
        name: "task",
        type: "string",
        description: "The message to send to the A2A agent",
      },
    ],
    render: (actionRenderProps: MessageActionRenderProps) => {
      return (
        <>
          <MessageToA2A {...actionRenderProps} />
          <MessageFromA2A {...actionRenderProps} />
        </>
      );
    },
  });

  return (
    <div className="h-[600px]">
      <CopilotChat
        className="h-full"
        labels={{
          initial: "👋 Hi! I'm your travel planning assistant. Ask me to plan a trip!",
        }}
        instructions="You are a helpful travel planning assistant. Help users plan their trips by coordinating with specialized agents."
      />
    </div>
  );
};

/**
 * Main Travel Chat Component
 * Wraps the chat in CopilotKit provider
 */
export default function TravelChat() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
      agent="travel_planner"
    >
      <ChatInner />
    </CopilotKit>
  );
}
