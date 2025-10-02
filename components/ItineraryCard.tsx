import React from "react";

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

export interface RestaurantData {
  destination: string;
  days: number;
  meals: Array<{
    day: number;
    breakfast: string;
    lunch: string;
    dinner: string;
  }>;
}

interface ItineraryCardProps {
  data: ItineraryData;
  restaurantData?: RestaurantData | null;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ data, restaurantData }) => {
  const getMealsForDay = (dayNumber: number): Meals | null => {
    if (!restaurantData) return null;

    const dayMeals = restaurantData.meals.find((m) => m.day === dayNumber);
    if (!dayMeals) return null;

    return {
      breakfast: dayMeals.breakfast,
      lunch: dayMeals.lunch,
      dinner: dayMeals.dinner,
    };
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 my-3 border-2 border-[#DBDBE5] shadow-elevation-md animate-fade-in-up">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🗺️</span>
          <h2 className="text-xl font-semibold text-[#010507]">{data.destination} Itinerary</h2>
        </div>
        <p className="text-[#57575B] text-xs">
          {data.days} day{data.days > 1 ? "s" : ""} of adventure
        </p>
      </div>

      <div className="space-y-3">
        {data.itinerary.map((day, index) => {
          const restaurantMeals = getMealsForDay(day.day);
          const mealsToDisplay = restaurantMeals || day.meals;

          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-elevation-sm border border-[#E9E9EF]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#DBDBE5]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#BEC2FF] text-white font-bold text-sm">
                  {day.day}
                </div>
                <h3 className="text-lg font-semibold text-[#010507]">{day.title}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
                <div className="lg:col-span-3 space-y-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">📅</span>
                    <h4 className="text-sm font-semibold text-[#010507]">Day Itinerary</h4>
                  </div>
                  <TimeSlotSection
                    icon="🌅"
                    title="Morning"
                    location={day.morning.location}
                    activities={day.morning.activities}
                    color="orange"
                  />
                  <TimeSlotSection
                    icon="☀️"
                    title="Afternoon"
                    location={day.afternoon.location}
                    activities={day.afternoon.activities}
                    color="yellow"
                  />
                  <TimeSlotSection
                    icon="🌆"
                    title="Evening"
                    location={day.evening.location}
                    activities={day.evening.activities}
                    color="blue"
                  />
                </div>

                <div className="lg:col-span-4 flex flex-col">
                  <div className="lg:border-l lg:border-[#DBDBE5] lg:pl-2 flex flex-col h-full">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">🍽️</span>
                      <h4 className="text-sm font-semibold text-[#010507]">Meals</h4>
                      {!restaurantMeals && (
                        <span className="ml-auto text-[9px] text-[#BEC2FF] font-medium animate-pulse">
                          Loading...
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-1 space-y-1">
                      {restaurantMeals ? (
                        <>
                          <MealItem icon="🥐" label="Breakfast" meal={mealsToDisplay.breakfast} />
                          <MealItem icon="🍜" label="Lunch" meal={mealsToDisplay.lunch} />
                          <MealItem icon="🍷" label="Dinner" meal={mealsToDisplay.dinner} />
                        </>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center justify-center bg-[#F7F7F9] rounded p-1">
                            <span className="text-[10px] text-[#838389]">
                              Awaiting recommendations...
                            </span>
                          </div>
                          <div className="flex-1 flex items-center justify-center bg-[#F7F7F9] rounded p-1">
                            <span className="text-[10px] text-[#838389]">
                              Awaiting recommendations...
                            </span>
                          </div>
                          <div className="flex-1 flex items-center justify-center bg-[#F7F7F9] rounded p-1">
                            <span className="text-[10px] text-[#838389]">
                              Awaiting recommendations...
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
    orange: "bg-[#FFAC4D]/10 border-[#FFAC4D]",
    yellow: "bg-[#FFF388]/10 border-[#FFF388]",
    blue: "bg-[#BEC2FF]/10 border-[#BEC2FF]",
  };

  return (
    <div className={`rounded-lg p-2 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">{icon}</span>
        <h4 className="text-sm font-semibold text-[#010507]">{title}</h4>
        <span className="text-xs text-[#838389]">• {location}</span>
      </div>
      <ul className="space-y-0.5 ml-5">
        {activities.map((activity, idx) => (
          <li key={idx} className="text-xs text-[#57575B] flex items-start">
            <span className="text-[#838389] mr-1">•</span>
            <span>{activity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface MealItemProps {
  icon: string;
  label: string;
  meal: string;
}

const MealItem: React.FC<MealItemProps> = ({ icon, label, meal }) => {
  return (
    <div className="flex items-start gap-1 p-1 bg-[#F7F7F9] rounded flex-1 border border-[#E9E9EF]">
      <span className="text-xs">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[#838389]">{label}</div>
        <div className="text-xs text-[#010507] break-words">{meal}</div>
      </div>
    </div>
  );
};
