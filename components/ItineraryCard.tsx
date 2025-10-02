/**
 * ItineraryCard Component
 *
 * Displays a beautiful, structured travel itinerary with day-by-day breakdown.
 * Shows activities for morning, afternoon, evening, and meal recommendations.
 */

import React from "react";

// Type definitions matching the backend structure
interface TimeSlot {
  activities: string[];
  location: string;
}

interface Meals {
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface DayItinerary {
  day: number;
  title: string;
  morning: TimeSlot;
  afternoon: TimeSlot;
  evening: TimeSlot;
  meals: Meals;
}

export interface ItineraryData {
  destination: string;
  days: number;
  itinerary: DayItinerary[];
}

interface ItineraryCardProps {
  data: ItineraryData;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 my-4 border border-purple-200 shadow-lg animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🗺️</span>
          <h2 className="text-2xl font-bold text-purple-900">
            {data.destination} Itinerary
          </h2>
        </div>
        <p className="text-purple-700 text-sm">
          {data.days} day{data.days > 1 ? "s" : ""} of adventure
        </p>
      </div>

      {/* Days */}
      <div className="space-y-6">
        {data.itinerary.map((day, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-5 shadow-md border border-purple-100"
          >
            {/* Day Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-100">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 text-white font-bold">
                {day.day}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{day.title}</h3>
            </div>

            {/* Time Slots */}
            <div className="space-y-4">
              {/* Morning */}
              <TimeSlotSection
                icon="🌅"
                title="Morning"
                location={day.morning.location}
                activities={day.morning.activities}
                color="orange"
              />

              {/* Afternoon */}
              <TimeSlotSection
                icon="☀️"
                title="Afternoon"
                location={day.afternoon.location}
                activities={day.afternoon.activities}
                color="yellow"
              />

              {/* Evening */}
              <TimeSlotSection
                icon="🌆"
                title="Evening"
                location={day.evening.location}
                activities={day.evening.activities}
                color="blue"
              />

              {/* Meals */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🍽️</span>
                  <h4 className="font-semibold text-gray-800">Meals</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <MealItem icon="🥐" label="Breakfast" meal={day.meals.breakfast} />
                  <MealItem icon="🍜" label="Lunch" meal={day.meals.lunch} />
                  <MealItem icon="🍷" label="Dinner" meal={day.meals.dinner} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper component for time slots
interface TimeSlotSectionProps {
  icon: string;
  title: string;
  location: string;
  activities: string[];
  color: "orange" | "yellow" | "blue";
}

const TimeSlotSection: React.FC<TimeSlotSectionProps> = ({
  icon,
  title,
  location,
  activities,
  color,
}) => {
  const colorClasses = {
    orange: "bg-orange-50 border-orange-200",
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <span className="text-xs text-gray-500">• {location}</span>
      </div>
      <ul className="space-y-1 ml-7">
        {activities.map((activity, idx) => (
          <li key={idx} className="text-sm text-gray-700 flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span>{activity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper component for meals
interface MealItemProps {
  icon: string;
  label: string;
  meal: string;
}

const MealItem: React.FC<MealItemProps> = ({ icon, label, meal }) => {
  return (
    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
      <span className="text-sm">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-xs text-gray-700 truncate" title={meal}>
          {meal}
        </div>
      </div>
    </div>
  );
};
