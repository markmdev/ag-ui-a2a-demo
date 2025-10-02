"use client";

/**
 * Travel Chat Component
 *
 * This is the main chat interface for the travel planning demo.
 * It demonstrates several key patterns:
 *
 * 1. **A2A Communication Visualization**: Shows message flow between
 *    the orchestrator and specialized agents (Itinerary, Budget, Weather, Restaurant)
 *
 * 2. **Human-in-the-Loop (HITL)**: Implements two HITL patterns:
 *    - Trip requirements gathering at the start
 *    - Budget approval workflow
 *
 * 3. **Generative UI**: Extracts structured data from agent responses
 *    and passes it to parent component for rich UI display
 *
 * 4. **Multi-Agent Coordination**: Coordinates between 4 specialized agents
 *    across 2 frameworks (LangGraph + ADK) via A2A Protocol
 */

import React, { useState, useEffect } from "react";
import { CopilotKit, useCopilotChat } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./style.css";

// Import shared types
import type {
  TravelChatProps,
  ItineraryData,
  BudgetData,
  WeatherData,
  RestaurantData,
  MessageActionRenderProps,
  BudgetApprovalActionRenderProps,
} from "./types";

// Import extracted components
import { MessageToA2A } from "./a2a/MessageToA2A";
import { MessageFromA2A } from "./a2a/MessageFromA2A";
import { TripRequirementsForm } from "./forms/TripRequirementsForm";
import { BudgetApprovalCard } from "./hitl/BudgetApprovalCard";
import { WeatherCard } from "./WeatherCard";

/**
 * Inner chat component that uses CopilotKit hooks
 *
 * This component handles:
 * - Message extraction from A2A agent responses
 * - Action registration for A2A messages and HITL workflows
 * - State management for approval workflows
 * - Data passing to parent via callbacks
 */
const ChatInner = ({
  onItineraryUpdate,
  onBudgetUpdate,
  onWeatherUpdate,
  onRestaurantUpdate,
}: TravelChatProps) => {
  // State for tracking budget approval/rejection
  const [approvalStates, setApprovalStates] = useState<
    Record<string, { approved: boolean; rejected: boolean }>
  >({});

  // State for weather data (used for generative UI)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Get all visible messages from CopilotChat
  const { visibleMessages } = useCopilotChat();

  /**
   * Extract structured data from A2A agent responses
   *
   * This effect monitors all messages and extracts JSON data from
   * completed A2A agent responses. It then updates the parent component
   * via callbacks to display the data in the main content area.
   *
   * Key pattern: The A2A middleware wraps responses in "A2A Agent Response: "
   * prefix, so we strip that before parsing JSON.
   */
  useEffect(() => {
    const extractDataFromMessages = () => {
      for (const message of visibleMessages) {
        const msg = message as any;

        // Look for ResultMessage from A2A agents
        if (msg.type === "ResultMessage" && msg.actionName === "send_message_to_a2a_agent") {
          try {
            const result = msg.result;
            let parsed;

            // Parse JSON from result
            if (typeof result === "string") {
              // Strip A2A prefix if present
              let cleanResult = result;
              if (result.startsWith("A2A Agent Response: ")) {
                cleanResult = result.substring("A2A Agent Response: ".length);
              }
              parsed = JSON.parse(cleanResult);
            } else if (typeof result === "object" && result !== null) {
              parsed = result;
            }

            // Identify data type and update parent
            if (parsed) {
              // Itinerary data (has destination, itinerary array)
              if (parsed.destination && parsed.itinerary && Array.isArray(parsed.itinerary)) {
                onItineraryUpdate?.(parsed as ItineraryData);
              }
              // Budget data (has totalBudget, breakdown array)
              else if (parsed.totalBudget && parsed.breakdown && Array.isArray(parsed.breakdown)) {
                const budgetKey = `budget-${parsed.totalBudget}`;
                const isApproved = approvalStates[budgetKey]?.approved || false;
                // Only update if approved (budget requires HITL approval)
                if (isApproved) {
                  onBudgetUpdate?.(parsed as BudgetData);
                }
              }
              // Weather data (has destination, forecast array)
              else if (parsed.destination && parsed.forecast && Array.isArray(parsed.forecast)) {
                const weatherDataParsed = parsed as WeatherData;
                setWeatherData(weatherDataParsed);
                onWeatherUpdate?.(weatherDataParsed);
              }
              // Restaurant data (has destination, meals array)
              else if (parsed.destination && parsed.meals && Array.isArray(parsed.meals)) {
                onRestaurantUpdate?.(parsed as RestaurantData);
              }
            }
          } catch (e) {
            // Silently fail on invalid JSON
          }
        }
      }
    };

    extractDataFromMessages();
  }, [
    visibleMessages,
    approvalStates,
    onItineraryUpdate,
    onBudgetUpdate,
    onWeatherUpdate,
    onRestaurantUpdate,
  ]);

  /**
   * Register A2A message visualizer
   *
   * This action renders the green/blue boxes showing message flow
   * between the orchestrator and A2A agents.
   */
  useCopilotAction({
    name: "send_message_to_a2a_agent",
    description: "Sends a message to an A2A agent",
    available: "frontend", // Only rendered, not executed
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

  /**
   * Register HITL budget approval workflow
   *
   * This action pauses the agent workflow and waits for the user to
   * approve or reject the budget before proceeding.
   */
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
        // Validate budget data exists
        if (!args.budgetData || typeof args.budgetData !== "object") {
          return <div className="text-xs text-gray-500 p-2">Loading budget data...</div>;
        }

        const budget = args.budgetData as BudgetData;

        // Validate required fields
        if (!budget.totalBudget || !budget.breakdown) {
          return <div className="text-xs text-gray-500 p-2">Loading budget data...</div>;
        }

        // Create unique key for this budget
        const budgetKey = `budget-${budget.totalBudget}`;
        const currentState = approvalStates[budgetKey] || { approved: false, rejected: false };

        // Handlers for approve/reject
        const handleApprove = () => {
          setApprovalStates((prev) => ({
            ...prev,
            [budgetKey]: { approved: true, rejected: false },
          }));
          respond?.({ approved: true, message: "Budget approved by user" });
        };

        const handleReject = () => {
          setApprovalStates((prev) => ({
            ...prev,
            [budgetKey]: { approved: false, rejected: true },
          }));
          respond?.({ approved: false, message: "Budget rejected by user" });
        };

        return (
          <BudgetApprovalCard
            budgetData={budget}
            isApproved={currentState.approved}
            isRejected={currentState.rejected}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      },
    },
    [approvalStates]
  );

  /**
   * Register HITL trip requirements gathering
   *
   * This action collects essential trip information at the start
   * before calling any agents.
   */
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

  /**
   * Register generative UI for Weather Agent responses
   *
   * This displays the WeatherCard inline in the chat when weather data is received.
   * Note: Weather data is also displayed in the main content area.
   */
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
      // Validate weather data
      if (!args.weatherData || typeof args.weatherData !== "object") {
        return <></>;
      }

      const weather = args.weatherData as WeatherData;

      // Validate required fields
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

  // Weather data is automatically displayed via the generative UI when populated

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
 *
 * Wraps the chat in CopilotKit provider and connects to the
 * A2A middleware agent.
 */
export default function TravelChat({
  onItineraryUpdate,
  onBudgetUpdate,
  onWeatherUpdate,
  onRestaurantUpdate,
}: TravelChatProps) {
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
