/**
 * MessageFromA2A Component
 *
 * Displays incoming responses FROM A2A agents back to the Orchestrator.
 * Shows as a blue box with:
 * - Agent badge (sender) with framework-specific styling
 * - Arrow indicating direction
 * - Orchestrator badge (receiver)
 * - "Response received" confirmation
 *
 * This component visualizes the return path of A2A Protocol communication
 * where specialized agents send results back to the orchestrator.
 *
 * Note: This only shows the communication badge, not the actual data.
 * The structured data (itinerary, budget, etc.) is rendered separately
 * in the main content area via generative UI components.
 */

import React from "react";
import { MessageActionRenderProps } from "../types";
import { getAgentStyle } from "./agent-styles";

export const MessageFromA2A: React.FC<MessageActionRenderProps> = ({ status, args }) => {
  // Only render when the action is complete
  // This ensures we don't show response badges before data is received
  switch (status) {
    case "complete":
      break;
    default:
      return null;
  }

  // Get styling based on the source agent
  const agentStyle = getAgentStyle(args.agentName);

  return (
    <div className="my-2">
      {/* Agent Communication Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Sender and Receiver Badges */}
          <div className="flex items-center gap-2 min-w-[200px] flex-shrink-0">
            {/* Source Agent (Sender) */}
            <div className="flex flex-col items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${agentStyle.bgColor} ${agentStyle.textColor} ${agentStyle.borderColor} flex items-center gap-1`}
              >
                <span>{agentStyle.icon}</span>
                <span>{args.agentName}</span>
              </span>
              {agentStyle.framework && (
                <span className="text-[9px] text-gray-500 mt-0.5">{agentStyle.framework}</span>
              )}
            </div>

            {/* Direction Arrow */}
            <span className="text-gray-400 text-sm">→</span>

            {/* Orchestrator (Receiver) */}
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">
                Orchestrator
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">ADK</span>
            </div>
          </div>

          {/* Confirmation Message */}
          <span className="text-xs text-gray-600">✓ Response received</span>
        </div>
      </div>
    </div>
  );
};
