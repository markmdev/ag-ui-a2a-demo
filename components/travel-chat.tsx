"use client";

import React, { useState, useEffect } from "react";
import { CopilotKit, useCopilotChat } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import type { ActionRenderProps } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./style.css";
import { type ItineraryData } from "./ItineraryCard";
import { type BudgetData } from "./BudgetBreakdown";

/**
 * Travel Chat Component
 *
 * This component demonstrates:
 * 1. A2A (Agent-to-Agent) communication with visual badges
 * 2. Human-in-the-Loop (HITL) budget approval
 * 3. Generative UI for structured agent responses
 */

// Props for TravelChat component
interface TravelChatProps {
  onItineraryUpdate?: (data: ItineraryData | null) => void;
  onBudgetUpdate?: (data: BudgetData | null) => void;
}

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
    }
  ]
>;

// Type for the budget approval action parameters
type BudgetApprovalActionRenderProps = ActionRenderProps<
  [
    {
      readonly name: "budgetData";
      readonly type: "object";
      readonly description: "The budget data to approve";
    }
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

  // Determine agent styling based on agent name
  const getAgentStyle = (agentName: string) => {
    if (agentName.toLowerCase().includes("itinerary")) {
      // LangGraph - Green branding
      return {
        bgColor: "bg-gradient-to-r from-emerald-100 to-green-100",
        textColor: "text-emerald-800",
        borderColor: "border-emerald-400",
        icon: "🔗",
        framework: "LangGraph",
      };
    }
    if (agentName.toLowerCase().includes("budget")) {
      // Google ADK - Blue/Google branding
      return {
        bgColor: "bg-gradient-to-r from-blue-100 to-sky-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-400",
        icon: "✨",
        framework: "ADK",
      };
    }
    return {
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-300",
      icon: "🤖",
      framework: "",
    };
  };

  // Truncate long task descriptions
  const truncateTask = (task: string, maxLength: number = 80) => {
    if (task.length <= maxLength) return task;
    return task.substring(0, maxLength) + "...";
  };

  const agentStyle = getAgentStyle(args.agentName);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 my-2 a2a-message-enter">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-center">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">
              Orchestrator
            </span>
            <span className="text-[9px] text-gray-500 mt-0.5">ADK</span>
          </div>
          <span className="text-gray-400 text-sm">→</span>
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
        <span className="text-gray-700 text-sm flex-1 min-w-0 break-words" title={args.task}>
          {truncateTask(args.task)}
        </span>
      </div>
    </div>
  );
};

/**
 * Component to render incoming responses FROM A2A agents
 * Shows only communication badges (generative UI will be in main area)
 */
const MessageFromA2A = ({ status, args }: MessageActionRenderProps) => {
  // Use switch statement like dojo example for clarity
  switch (status) {
    case "complete":
      break;
    default:
      return null;
  }

  // Determine agent styling based on agent name
  const getAgentStyle = (agentName: string) => {
    if (agentName.toLowerCase().includes("itinerary")) {
      // LangGraph - Green branding
      return {
        bgColor: "bg-gradient-to-r from-emerald-100 to-green-100",
        textColor: "text-emerald-800",
        borderColor: "border-emerald-400",
        icon: "🔗",
        framework: "LangGraph",
      };
    }
    if (agentName.toLowerCase().includes("budget")) {
      // Google ADK - Blue/Google branding
      return {
        bgColor: "bg-gradient-to-r from-blue-100 to-sky-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-400",
        icon: "✨",
        framework: "ADK",
      };
    }
    return {
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-300",
      icon: "🤖",
      framework: "",
    };
  };

  const agentStyle = getAgentStyle(args.agentName);

  return (
    <div className="my-2">
      {/* Agent Communication Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[200px] flex-shrink-0">
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
            <span className="text-gray-400 text-sm">→</span>
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">
                Orchestrator
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">ADK</span>
            </div>
          </div>
          <span className="text-xs text-gray-600">✓ Response received</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Inner chat component that uses CopilotKit hooks
 */
const ChatInner = ({ onItineraryUpdate, onBudgetUpdate }: TravelChatProps) => {
  const [approvalStates, setApprovalStates] = useState<Record<string, { approved: boolean; rejected: boolean }>>({});
  const { visibleMessages } = useCopilotChat();

  // Extract structured data from messages and pass to parent
  useEffect(() => {
    console.log("🔍 DEBUG: visibleMessages changed, count:", visibleMessages.length);

    // Look for ResultMessage types with A2A agent results
    const extractDataFromMessages = () => {
      for (const message of visibleMessages) {
        const msg = message as any;

        // Check if this is a ResultMessage from an A2A agent
        if (msg.type === "ResultMessage" && msg.actionName === "send_message_to_a2a_agent") {
          console.log("🔍 DEBUG: Found A2A result message:", msg.actionExecutionId);

          try {
            const result = msg.result;
            console.log("🔍 DEBUG: Result type:", typeof result);
            console.log("🔍 DEBUG: Result value:", result);

            let parsed;

            // Parse result if it's a string
            if (typeof result === "string") {
              // Strip "A2A Agent Response: " prefix if present
              let cleanResult = result;
              if (result.startsWith("A2A Agent Response: ")) {
                cleanResult = result.substring("A2A Agent Response: ".length);
              }
              console.log("🔍 DEBUG: Parsing JSON:", cleanResult.substring(0, 100) + "...");
              parsed = JSON.parse(cleanResult);
            } else if (typeof result === "object" && result !== null) {
              parsed = result;
            }

            console.log("🔍 DEBUG: Parsed data:", parsed);

            // Check data type and update parent
            if (parsed) {
              if (parsed.destination && parsed.itinerary && Array.isArray(parsed.itinerary)) {
                console.log("✅ DEBUG: Found itinerary data, updating parent");
                onItineraryUpdate?.(parsed as ItineraryData);
              } else if (
                parsed.totalBudget &&
                parsed.breakdown &&
                Array.isArray(parsed.breakdown)
              ) {
                const budgetKey = `budget-${parsed.totalBudget}`;
                const isApproved = approvalStates[budgetKey]?.approved || false;
                console.log("✅ DEBUG: Found budget data, isApproved:", isApproved);
                // Only update budget if it's been approved
                if (isApproved) {
                  console.log("✅ DEBUG: Updating budget in main area");
                  onBudgetUpdate?.(parsed as BudgetData);
                } else {
                  console.log("⏳ DEBUG: Budget not approved yet, skipping update");
                }
              }
            }
          } catch (e) {
            console.error("❌ DEBUG: Failed to parse agent response:", e);
          }
        }
      }
    };

    extractDataFromMessages();
  }, [visibleMessages, approvalStates, onItineraryUpdate, onBudgetUpdate]);

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

  // Register HITL budget approval action
  useCopilotAction(
    {
      name: "request_budget_approval",
      description: "Request user approval for the travel budget",
      parameters: [
        {
          name: "budgetData",
          type: "object",
          description: "The budget breakdown data requiring approval",
        },
      ],
      renderAndWaitForResponse: ({ args, respond }) => {
        console.log("💰 DEBUG: Budget approval renderAndWaitForResponse called");
        console.log("💰 DEBUG: args:", args);
        console.log("💰 DEBUG: args.budgetData:", args.budgetData);
        console.log("💰 DEBUG: typeof args.budgetData:", typeof args.budgetData);

        // Handle case where budgetData might be undefined or incomplete
        if (!args.budgetData || typeof args.budgetData !== "object") {
          return <div className="text-xs text-gray-500 p-2">Loading budget data...</div>;
        }

        const budget = args.budgetData as BudgetData;

        // Validate budget has required fields
        if (!budget.totalBudget || !budget.breakdown) {
          return <div className="text-xs text-gray-500 p-2">Loading budget data...</div>;
        }

        // Create unique key for this budget based on total amount
        const budgetKey = `budget-${budget.totalBudget}`;
        const currentState = approvalStates[budgetKey] || { approved: false, rejected: false };
        const isApproved = currentState.approved;
        const isRejected = currentState.rejected;

        // Format currency
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: budget.currency || "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount);
        };

        return (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6 my-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="text-xl font-bold text-amber-900">Budget Approval Required</h3>
                <p className="text-sm text-amber-700">
                  Please review and approve the estimated budget
                </p>
              </div>
            </div>

            {/* Budget Summary */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 font-medium">Total Budget</span>
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(budget.totalBudget)}
                </span>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {budget.breakdown?.map((category, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(category.amount)}
                      </span>
                      <span className="text-gray-400">({category.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              {budget.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">{budget.notes}</p>
                </div>
              )}
            </div>

            {/* Rejection Message */}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-lg">❌</span>
                  <div>
                    <p className="font-semibold text-sm">Budget Rejected</p>
                    <p className="text-xs text-red-700">
                      The agent has been notified and may revise the budget based on your feedback.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setApprovalStates((prev) => ({
                    ...prev,
                    [budgetKey]: { approved: true, rejected: false },
                  }));
                  respond?.({ approved: true, message: "Budget approved by user" });
                }}
                disabled={isApproved || isRejected}
                className={`flex-1 text-xs font-semibold py-1 px-3 rounded transition-all ${
                  isApproved
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : isRejected
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isApproved ? "✓ Approved" : "Approve Budget"}
              </button>
              <button
                onClick={() => {
                  setApprovalStates((prev) => ({
                    ...prev,
                    [budgetKey]: { approved: false, rejected: true },
                  }));
                  respond?.({ approved: false, message: "Budget rejected by user" });
                }}
                disabled={isApproved || isRejected}
                className={`flex-1 text-xs font-semibold py-1 px-3 rounded transition-all ${
                  isRejected
                    ? "bg-red-800 text-white cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isRejected ? "✗ Rejected" : "Reject"}
              </button>
            </div>
          </div>
        );
      },
    },
    [approvalStates]
  );

  return (
    <div className="h-full">
      <CopilotChat
        className="h-full"
        labels={{
          initial:
            "👋 Hi! I'm your travel planning assistant.\n\nAsk me to plan a trip and I'll coordinate with specialized agents to create your perfect itinerary!",
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
export default function TravelChat({ onItineraryUpdate, onBudgetUpdate }: TravelChatProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false} agent="a2a_chat">
      <ChatInner onItineraryUpdate={onItineraryUpdate} onBudgetUpdate={onBudgetUpdate} />
    </CopilotKit>
  );
}
