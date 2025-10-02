/**
 * MessageToA2A Component
 *
 * Displays outgoing messages from the Orchestrator TO A2A agents.
 * Shows as a green box with:
 * - Orchestrator badge (sender)
 * - Arrow indicating direction
 * - Agent badge (receiver) with framework-specific styling
 * - Truncated task description
 *
 * This component visualizes the A2A Protocol communication pattern
 * where the orchestrator delegates tasks to specialized agents.
 */

import React from "react";
import { MessageActionRenderProps } from "../types";
import { getAgentStyle, truncateTask } from "./agent-styles";

export const MessageToA2A: React.FC<MessageActionRenderProps> = ({ status, args }) => {
  // Only render when the action is executing or complete
  // This ensures we don't show messages before they're actually sent
  switch (status) {
    case "executing":
    case "complete":
      break;
    default:
      return null;
  }

  // Get styling based on the target agent
  const agentStyle = getAgentStyle(args.agentName);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 my-2 a2a-message-enter">
      <div className="flex items-start gap-3">
        {/* Sender and Receiver Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Orchestrator (Sender) */}
          <div className="flex flex-col items-center">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">
              Orchestrator
            </span>
            <span className="text-[9px] text-gray-500 mt-0.5">ADK</span>
          </div>

          {/* Direction Arrow */}
          <span className="text-gray-400 text-sm">→</span>

          {/* Target Agent (Receiver) */}
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
        </div>

        {/* Task Description */}
        <span className="text-gray-700 text-sm flex-1 min-w-0 break-words" title={args.task}>
          {truncateTask(args.task)}
        </span>
      </div>
    </div>
  );
};
