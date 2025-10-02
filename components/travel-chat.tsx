"use client";

import React, { useState, useEffect } from "react";
import { CopilotKit, useCopilotChat } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import type { ActionRenderProps } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./style.css";
import { type ItineraryData, type RestaurantData } from "./ItineraryCard";
import { type BudgetData } from "./BudgetBreakdown";
import { WeatherCard, type WeatherData } from "./WeatherCard";

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
  onWeatherUpdate?: (data: WeatherData | null) => void;
  onRestaurantUpdate?: (data: RestaurantData | null) => void;
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

// Type for trip requirements action parameters
type TripRequirementsActionRenderProps = ActionRenderProps<
  [
    {
      readonly name: "city";
      readonly type: "string";
      readonly description: "The destination city (may be pre-filled from user message)";
    },
    {
      readonly name: "numberOfDays";
      readonly type: "number";
      readonly description: "Number of days for the trip (1-7)";
    },
    {
      readonly name: "numberOfPeople";
      readonly type: "number";
      readonly description: "Number of people in the group (1-15)";
    },
    {
      readonly name: "budgetLevel";
      readonly type: "string";
      readonly description: "Budget level: Economy, Comfort, or Premium";
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
    if (agentName.toLowerCase().includes("restaurant")) {
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
    if (agentName.toLowerCase().includes("weather")) {
      // Google ADK - Blue/Weather branding
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
  const truncateTask = (task: string, maxLength: number = 50) => {
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
    if (agentName.toLowerCase().includes("restaurant")) {
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
    if (agentName.toLowerCase().includes("weather")) {
      // Google ADK - Blue/Weather branding
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
 * Component to render the trip requirements form
 * This is shown at the start to gather essential trip information
 */
const TripRequirementsForm = ({ args, respond }: { args: any; respond: any }) => {
  // Debug: Log the args to see what's being passed
  console.log("🔍 TripRequirementsForm RAW args:", args);
  console.log("🔍 typeof args:", typeof args);

  // Parse args if it's a string (sometimes CopilotKit passes stringified JSON)
  let parsedArgs = args;
  if (typeof args === "string") {
    try {
      parsedArgs = JSON.parse(args);
      console.log("🔍 Parsed args from string:", parsedArgs);
    } catch (e) {
      console.error("❌ Failed to parse args string:", e);
      parsedArgs = {};
    }
  }

  console.log("🔍 Final parsedArgs:", parsedArgs);
  console.log("🔍 parsedArgs.city:", parsedArgs?.city);
  console.log("🔍 parsedArgs.numberOfDays:", parsedArgs?.numberOfDays);
  console.log("🔍 parsedArgs.numberOfPeople:", parsedArgs?.numberOfPeople);
  console.log("🔍 parsedArgs.budgetLevel:", parsedArgs?.budgetLevel);

  // Initialize state with default values
  const [city, setCity] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [budgetLevel, setBudgetLevel] = useState("Comfort");
  const [submitted, setSubmitted] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update state when parsedArgs changes (pre-fill from orchestrator)
  useEffect(() => {
    console.log("🔍 useEffect triggered with parsedArgs:", parsedArgs);
    if (parsedArgs && parsedArgs.city && parsedArgs.city !== city) {
      console.log("✅ Setting city to:", parsedArgs.city);
      setCity(parsedArgs.city);
    }
    if (parsedArgs && parsedArgs.numberOfDays && parsedArgs.numberOfDays !== numberOfDays) {
      console.log("✅ Setting numberOfDays to:", parsedArgs.numberOfDays);
      setNumberOfDays(parsedArgs.numberOfDays);
    }
    if (parsedArgs && parsedArgs.numberOfPeople && parsedArgs.numberOfPeople !== numberOfPeople) {
      console.log("✅ Setting numberOfPeople to:", parsedArgs.numberOfPeople);
      setNumberOfPeople(parsedArgs.numberOfPeople);
    }
    if (parsedArgs && parsedArgs.budgetLevel && parsedArgs.budgetLevel !== budgetLevel) {
      console.log("✅ Setting budgetLevel to:", parsedArgs.budgetLevel);
      setBudgetLevel(parsedArgs.budgetLevel);
    }
  }, [parsedArgs?.city, parsedArgs?.numberOfDays, parsedArgs?.numberOfPeople, parsedArgs?.budgetLevel]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!city.trim()) {
      newErrors.city = "Please enter a destination city";
    }

    if (numberOfDays < 1 || numberOfDays > 7) {
      newErrors.numberOfDays = "Number of days must be between 1 and 7";
    }

    if (numberOfPeople < 1 || numberOfPeople > 15) {
      newErrors.numberOfPeople = "Number of people must be between 1 and 15";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setSubmitted(true);
    respond?.({
      city: city.trim(),
      numberOfDays,
      numberOfPeople,
      budgetLevel,
    });
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-xl p-6 my-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-3xl">✓</div>
          <div>
            <h3 className="text-xl font-bold text-green-900">Trip Requirements Submitted</h3>
            <p className="text-sm text-green-700">
              Planning your {numberOfDays}-day trip to {city} for {numberOfPeople} people with {budgetLevel} budget...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl p-6 my-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">✈️</div>
        <div>
          <h3 className="text-xl font-bold text-blue-900">Trip Planning Details</h3>
          <p className="text-sm text-blue-700">
            Please provide some information about your trip
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* City Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Destination City *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Paris, Tokyo, New York"
            className={`w-full px-4 py-2 rounded-lg border-2 transition-colors ${
              errors.city
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-white focus:border-blue-500 focus:outline-none"
            }`}
          />
          {errors.city && (
            <p className="text-xs text-red-600 mt-1">{errors.city}</p>
          )}
        </div>

        {/* Number of Days */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Days (1-7) *
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="7"
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(parseInt(e.target.value))}
              className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="w-12 text-center">
              <span className="text-2xl font-bold text-blue-900">{numberOfDays}</span>
            </div>
          </div>
          {errors.numberOfDays && (
            <p className="text-xs text-red-600 mt-1">{errors.numberOfDays}</p>
          )}
        </div>

        {/* Number of People */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of People (1-15) *
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="15"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(parseInt(e.target.value))}
              className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="w-12 text-center">
              <span className="text-2xl font-bold text-blue-900">{numberOfPeople}</span>
            </div>
          </div>
          {errors.numberOfPeople && (
            <p className="text-xs text-red-600 mt-1">{errors.numberOfPeople}</p>
          )}
        </div>

        {/* Budget Level Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Budget Level *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["Economy", "Comfort", "Premium"].map((level) => (
              <button
                key={level}
                onClick={() => setBudgetLevel(level)}
                className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                  budgetLevel === level
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400"
                }`}
              >
                {level === "Economy" && "💰"}
                {level === "Comfort" && "✨"}
                {level === "Premium" && "👑"}
                <div className="mt-1">{level}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          Start Planning My Trip
        </button>
      </div>
    </div>
  );
};

/**
 * Inner chat component that uses CopilotKit hooks
 */
const ChatInner = ({ onItineraryUpdate, onBudgetUpdate, onWeatherUpdate, onRestaurantUpdate }: TravelChatProps) => {
  const [approvalStates, setApprovalStates] = useState<
    Record<string, { approved: boolean; rejected: boolean }>
  >({});
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
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
              } else if (parsed.destination && parsed.forecast && Array.isArray(parsed.forecast)) {
                console.log("✅ DEBUG: Found weather data, updating parent and local state");
                const weatherDataParsed = parsed as WeatherData;
                setWeatherData(weatherDataParsed);
                onWeatherUpdate?.(weatherDataParsed);
              } else if (parsed.destination && parsed.meals && Array.isArray(parsed.meals)) {
                console.log("✅ DEBUG: Found restaurant data, updating parent");
                onRestaurantUpdate?.(parsed as RestaurantData);
              }
            }
          } catch (e) {
            console.error("❌ DEBUG: Failed to parse agent response:", e);
          }
        }
      }
    };

    extractDataFromMessages();
  }, [visibleMessages, approvalStates, onItineraryUpdate, onBudgetUpdate, onWeatherUpdate, onRestaurantUpdate]);

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

  // Register HITL trip requirements gathering action
  // This is called at the start to gather essential trip information
  useCopilotAction({
    name: "gather_trip_requirements",
    description: "Gather trip requirements from the user (city, days, people, budget level)",
    parameters: [
      {
        name: "city",
        type: "string",
        description: "The destination city (may be pre-filled from user message)",
        required: false,
      },
      {
        name: "numberOfDays",
        type: "number",
        description: "Number of days for the trip (1-7)",
        required: false,
      },
      {
        name: "numberOfPeople",
        type: "number",
        description: "Number of people in the group (1-15)",
        required: false,
      },
      {
        name: "budgetLevel",
        type: "string",
        description: "Budget level: Economy, Comfort, or Premium",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond }) => {
      return <TripRequirementsForm args={args} respond={respond} />;
    },
  });

  // Register generative UI for Weather Agent responses
  // This displays the WeatherCard inline in the chat when weather data is received
  useCopilotAction({
    name: "display_weather_forecast",
    description: "Display weather forecast data as generative UI in the chat",
    available: "frontend",
    parameters: [
      {
        name: "weatherData",
        type: "object",
        description: "Weather forecast data to display",
      },
    ],
    render: ({ args }) => {
      // Validate weather data exists and has required fields
      if (!args.weatherData || typeof args.weatherData !== "object") {
        return <></>;
      }

      const weather = args.weatherData as WeatherData;

      // Validate weather has required fields
      if (!weather.destination || !weather.forecast || !Array.isArray(weather.forecast)) {
        return <></>;
      }

      return (
        <div className="my-3">
          <WeatherCard data={weather} />
        </div>
      );
    },
  });

  // Auto-display weather when weatherData state is populated
  // This creates the generative UI display
  useEffect(() => {
    if (weatherData) {
      console.log("🌤️ DEBUG: Weather data available for generative UI display");
    }
  }, [weatherData]);

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
export default function TravelChat({ onItineraryUpdate, onBudgetUpdate, onWeatherUpdate, onRestaurantUpdate }: TravelChatProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false} agent="a2a_chat">
      <ChatInner
        onItineraryUpdate={onItineraryUpdate}
        onBudgetUpdate={onBudgetUpdate}
        onWeatherUpdate={onWeatherUpdate}
        onRestaurantUpdate={onRestaurantUpdate}
      />
    </CopilotKit>
  );
}
