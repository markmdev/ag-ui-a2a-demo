/**
 * BudgetBreakdown Component
 *
 * Displays a beautiful budget breakdown with visual bars showing
 * the percentage breakdown of travel costs by category.
 */

import React from "react";

// Type definitions matching the backend structure
interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetData {
  totalBudget: number;
  currency: string;
  breakdown: BudgetCategory[];
  notes: string;
}

interface BudgetBreakdownProps {
  data: BudgetData;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ data }) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Color mapping for categories
  const getCategoryColor = (index: number) => {
    const colors = [
      { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700" },
      { bg: "bg-green-500", light: "bg-green-100", text: "text-green-700" },
      { bg: "bg-yellow-500", light: "bg-yellow-100", text: "text-yellow-700" },
      { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700" },
      { bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-700" },
      { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-700" },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 my-3 border border-blue-200 shadow-lg animate-fade-in-up">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h2 className="text-xl font-bold text-blue-900">Budget Estimate</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(data.totalBudget)}
            </div>
            <div className="text-xs text-blue-600">{data.currency}</div>
          </div>
        </div>
        {data.notes && (
          <p className="text-xs text-blue-700 bg-blue-50 rounded p-2 border border-blue-200">
            ℹ️ {data.notes}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {data.breakdown.map((category, index) => {
          const colors = getCategoryColor(index);
          return (
            <div key={index} className="bg-white rounded-lg p-2 shadow-sm">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
                  <span className="text-sm font-semibold text-gray-800">
                    {category.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${colors.bg} transition-all duration-1000 ease-out rounded-full`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
