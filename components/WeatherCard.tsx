/**
 * WeatherCard Component
 *
 * Displays weather forecast with daily conditions, temperatures, and travel advice.
 * Uses ADK blue styling to match the Weather Agent branding.
 */

import React from "react";

// Type definition matching the backend Weather Agent structure
export interface WeatherData {
  destination: string;
  forecast: Array<{
    day: number;
    date: string;
    condition: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
    humidity: number;
    windSpeed: number;
    description: string;
  }>;
  travelAdvice: string;
  bestDays: number[];
}

interface WeatherCardProps {
  data: WeatherData;
}

/**
 * Get weather icon based on condition
 */
const getWeatherIcon = (condition: string): string => {
  const cond = condition.toLowerCase();
  if (cond.includes("sun") || cond.includes("clear")) return "☀️";
  if (cond.includes("cloud")) return "☁️";
  if (cond.includes("rain")) return "🌧️";
  if (cond.includes("storm")) return "⛈️";
  if (cond.includes("snow")) return "❄️";
  if (cond.includes("fog") || cond.includes("mist")) return "🌫️";
  return "🌤️";
};

/**
 * Get condition color styling
 */
const getConditionStyle = (condition: string) => {
  const cond = condition.toLowerCase();
  if (cond.includes("sun") || cond.includes("clear"))
    return "bg-yellow-50 border-yellow-200 text-yellow-800";
  if (cond.includes("cloud")) return "bg-gray-50 border-gray-200 text-gray-800";
  if (cond.includes("rain") || cond.includes("storm"))
    return "bg-blue-50 border-blue-300 text-blue-800";
  return "bg-sky-50 border-sky-200 text-sky-800";
};

export const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl p-4 my-3 border border-blue-200 shadow-lg animate-fade-in-up">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌤️</span>
          <h2 className="text-xl font-bold text-blue-900">{data.destination} Weather</h2>
        </div>
        <p className="text-blue-700 text-xs">{data.forecast.length}-day forecast</p>
      </div>

      {/* Forecast Days */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
        {data.forecast.map((day, index) => {
          const isBestDay = data.bestDays.includes(day.day);
          return (
            <div
              key={index}
              className={`bg-white rounded-lg p-2 shadow-sm border ${
                isBestDay ? "border-green-300 ring-2 ring-green-200" : "border-blue-100"
              } relative`}
            >
              {/* Best Day Badge */}
              {isBestDay && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  BEST
                </div>
              )}

              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-[10px]">
                    {day.day}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600">{day.date}</span>
                </div>
                <span className="text-xl">{getWeatherIcon(day.condition)}</span>
              </div>

              {/* Condition */}
              <div
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded mb-1 text-center ${getConditionStyle(
                  day.condition
                )}`}
              >
                {day.condition}
              </div>

              {/* Temperature */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-900">{day.highTemp}°</span>
                <span className="text-xs text-gray-500">{day.lowTemp}°</span>
              </div>

              {/* Weather Stats */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[9px] text-gray-600">
                  <span>💧 {day.precipitation}%</span>
                  <span>💨 {day.windSpeed}mph</span>
                </div>
                <div className="text-[9px] text-gray-600 text-center">
                  Humidity {day.humidity}%
                </div>
              </div>

              {/* Description */}
              {day.description && (
                <div className="mt-1 pt-1 border-t border-gray-100">
                  <p className="text-[9px] text-gray-600 line-clamp-2">{day.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Travel Advice */}
      {data.travelAdvice && (
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">💼</span>
            <h3 className="text-sm font-bold text-gray-900">Travel Advice</h3>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{data.travelAdvice}</p>
        </div>
      )}

      {/* Best Days Highlight */}
      {data.bestDays && data.bestDays.length > 0 && (
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-1">
            <span className="text-xs">✨</span>
            <span className="text-xs font-semibold text-green-800">
              Best days for outdoor activities: Day {data.bestDays.join(", Day ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
