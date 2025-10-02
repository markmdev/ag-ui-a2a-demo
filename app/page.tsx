"use client";

import { useState } from "react";
import TravelChat from "@/components/travel-chat";
import { ItineraryCard, type ItineraryData } from "@/components/ItineraryCard";
import { BudgetBreakdown, type BudgetData } from "@/components/BudgetBreakdown";
import { WeatherCard, type WeatherData } from "@/components/WeatherCard";
import { type RestaurantData } from "@/components/ItineraryCard";

export default function Home() {
  // State to hold structured data from agents
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar - Chat */}
      <div className="w-[450px] flex-shrink-0 border-r border-gray-200 bg-white shadow-xl flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Travel Planning</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Multi-Agent A2A Demo: <span className="text-emerald-600 font-semibold">1 LangGraph</span> +{" "}
            <span className="text-blue-600 font-semibold">3 ADK</span> agents
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Orchestrator-mediated A2A Protocol
          </p>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <TravelChat
            onItineraryUpdate={setItineraryData}
            onBudgetUpdate={setBudgetData}
            onWeatherUpdate={setWeatherData}
            onRestaurantUpdate={setRestaurantData}
          />
        </div>

        {/* Agent Legend */}
        <div className="p-4 border-t border-gray-200 space-y-3 text-xs">
          <div className="font-semibold text-gray-700 text-[11px] mb-2">AGENT FRAMEWORK</div>

          {/* LangGraph Agent */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
              🔗 LangGraph (Python + OpenAI)
            </div>
            <div className="pl-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Itinerary Agent</span>
              </div>
            </div>
          </div>

          {/* ADK Agents */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
              ✨ ADK (Python + Gemini)
            </div>
            <div className="pl-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Weather Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Restaurant Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Budget Agent</span>
              </div>
            </div>
          </div>

          {/* Orchestrator */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-gray-600 font-medium">Orchestrator</span>
            </div>
            <div className="text-[10px] text-gray-500 pl-4 mt-0.5">A2A Middleware Coordinator</div>
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
              Multi-agent coordination across 4 specialized agents with A2A Protocol and human-in-the-loop approval
            </p>
          </div>

          {/* Generative UI Display */}
          {!itineraryData && !budgetData && !weatherData && (
            <div className="flex items-center justify-center h-[400px] bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Start Planning Your Trip
                </h3>
                <p className="text-gray-500 max-w-md">
                  Ask the assistant to plan a trip. Watch as 4 specialized agents collaborate through
                  A2A Protocol to create your personalized plan.
                </p>
              </div>
            </div>
          )}

          {/* Display Weather Card (Full Width) */}
          {weatherData && (
            <div className="mb-4">
              <WeatherCard data={weatherData} />
            </div>
          )}

          {/* Display Itinerary and Budget Side-by-Side */}
          {(itineraryData || budgetData) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Display Itinerary with Restaurant Data */}
              {itineraryData && (
                <div>
                  <ItineraryCard data={itineraryData} restaurantData={restaurantData} />
                </div>
              )}

              {/* Display Budget */}
              {budgetData && (
                <div>
                  <BudgetBreakdown data={budgetData} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
