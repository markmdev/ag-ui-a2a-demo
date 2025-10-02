"use client";

import { useState } from "react";
import TravelChat from "@/components/travel-chat";
import { ItineraryCard, type ItineraryData } from "@/components/ItineraryCard";
import { BudgetBreakdown, type BudgetData } from "@/components/BudgetBreakdown";

export default function Home() {
  // State to hold structured data from agents
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar - Chat */}
      <div className="w-[450px] flex-shrink-0 border-r border-gray-200 bg-white shadow-xl flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Travel Planning</h1>
          <p className="text-sm text-gray-600">
            A2A + AG-UI Demo with <span className="text-blue-600 font-semibold">ADK</span> +{" "}
            <span className="text-purple-600 font-semibold">LangGraph</span>
          </p>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <TravelChat
            onItineraryUpdate={setItineraryData}
            onBudgetUpdate={setBudgetData}
          />
        </div>

        {/* Agent Legend */}
        <div className="p-4 border-t border-gray-200 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Itinerary Agent (LangGraph)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Budget Agent (ADK)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-gray-600">Orchestrator (Middleware)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Travel Plan</h2>
            <p className="text-gray-600">
              Intelligent travel planning with agent-to-agent coordination and human-in-the-loop approval
            </p>
          </div>

          {/* Generative UI Display */}
          {!itineraryData && !budgetData && (
            <div className="flex items-center justify-center h-[400px] bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Start Planning Your Trip
                </h3>
                <p className="text-gray-500 max-w-md">
                  Ask the assistant to plan a trip. You'll see agent communication, approve the budget, and view your personalized plan here.
                </p>
              </div>
            </div>
          )}

          {/* Display Itinerary */}
          {itineraryData && <ItineraryCard data={itineraryData} />}

          {/* Display Budget */}
          {budgetData && <BudgetBreakdown data={budgetData} />}
        </div>
      </div>
    </div>
  );
}
