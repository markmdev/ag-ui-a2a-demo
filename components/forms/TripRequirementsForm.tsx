/**
 * TripRequirementsForm Component
 *
 * A form component that collects essential trip planning information:
 * - Destination city
 * - Number of days (1-7)
 * - Number of people (1-15)
 * - Budget level (Economy/Comfort/Premium)
 *
 * This form is shown at the start of the travel planning workflow
 * before any agents are called. It implements Human-in-the-Loop (HITL)
 * pattern by waiting for user input before proceeding.
 *
 * Features:
 * - Pre-filling from orchestrator extraction (if user mentions details)
 * - Form validation
 * - Visual feedback (sliders, buttons)
 * - Success state after submission
 */

import React, { useState, useEffect } from "react";

interface TripRequirementsFormProps {
  args: any;
  respond: any;
}

export const TripRequirementsForm: React.FC<TripRequirementsFormProps> = ({ args, respond }) => {
  // Parse args if it's a string (sometimes CopilotKit passes stringified JSON)
  let parsedArgs = args;
  if (typeof args === "string") {
    try {
      parsedArgs = JSON.parse(args);
    } catch (e) {
      parsedArgs = {};
    }
  }

  // Initialize state with default values
  const [city, setCity] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [budgetLevel, setBudgetLevel] = useState("Comfort");
  const [submitted, setSubmitted] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update state when parsedArgs changes (pre-fill from orchestrator)
  // This allows the orchestrator to extract values from user messages like
  // "Plan a 5-day trip to Paris for 2 people" and pre-fill the form
  useEffect(() => {
    if (parsedArgs && parsedArgs.city && parsedArgs.city !== city) {
      setCity(parsedArgs.city);
    }
    if (parsedArgs && parsedArgs.numberOfDays && parsedArgs.numberOfDays !== numberOfDays) {
      setNumberOfDays(parsedArgs.numberOfDays);
    }
    if (parsedArgs && parsedArgs.numberOfPeople && parsedArgs.numberOfPeople !== numberOfPeople) {
      setNumberOfPeople(parsedArgs.numberOfPeople);
    }
    if (parsedArgs && parsedArgs.budgetLevel && parsedArgs.budgetLevel !== budgetLevel) {
      setBudgetLevel(parsedArgs.budgetLevel);
    }
  }, [parsedArgs?.city, parsedArgs?.numberOfDays, parsedArgs?.numberOfPeople, parsedArgs?.budgetLevel]);

  /**
   * Validate form inputs before submission
   */
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

  /**
   * Handle form submission
   * Sends trip requirements back to the orchestrator
   */
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

  // Show success state after submission
  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-xl p-6 my-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-3xl">✓</div>
          <div>
            <h3 className="text-xl font-bold text-green-900">Trip Requirements Submitted</h3>
            <p className="text-sm text-green-700">
              Planning your {numberOfDays}-day trip to {city} for {numberOfPeople} people with{" "}
              {budgetLevel} budget...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render the form
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl p-6 my-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">✈️</div>
        <div>
          <h3 className="text-xl font-bold text-blue-900">Trip Planning Details</h3>
          <p className="text-sm text-blue-700">Please provide some information about your trip</p>
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
          {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Level *</label>
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
