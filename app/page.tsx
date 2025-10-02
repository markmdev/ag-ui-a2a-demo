"use client";

import A2AChat from "@/components/a2a_chat";
import TravelChat from "@/components/travel-chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AG-UI + A2A Demo</h1>
          <p className="text-gray-600">
            Agent-to-Agent communication with{" "}
            <span className="text-blue-600 font-semibold">ADK</span> and{" "}
            <span className="text-purple-600 font-semibold">LangGraph</span>
          </p>
        </div>

        {/* Chat Component */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* <TravelChat /> */}
          <A2AChat />
        </div>

        {/* Agent Legend */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Itinerary Agent (LangGraph)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Budget Agent (ADK)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-600">Orchestrator</span>
          </div>
        </div>
      </div>
    </main>
  );
}
