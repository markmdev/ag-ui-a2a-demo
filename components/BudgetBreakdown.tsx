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
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 my-4 border border-blue-200 shadow-lg animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h2 className="text-2xl font-bold text-blue-900">Budget Estimate</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrency(data.totalBudget)}
            </div>
            <div className="text-sm text-blue-600">{data.currency}</div>
          </div>
        </div>
        {data.notes && (
          <p className="text-sm text-blue-700 bg-blue-50 rounded p-3 border border-blue-200">
            ℹ️ {data.notes}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        {data.breakdown.map((category, index) => {
          const colors = getCategoryColor(index);
          return (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                  <span className="font-semibold text-gray-800">
                    {category.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${colors.bg} transition-all duration-1000 ease-out rounded-full`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard
          label="Categories"
          value={data.breakdown.length.toString()}
          icon="📊"
        />
        <StatCard
          label="Average/Category"
          value={formatCurrency(data.totalBudget / data.breakdown.length)}
          icon="📈"
        />
        <StatCard
          label="Largest Item"
          value={
            data.breakdown.length > 0
              ? data.breakdown.reduce((max, cat) =>
                  cat.amount > max.amount ? cat : max
                ).category
              : "N/A"
          }
          icon="🎯"
        />
      </div>
    </div>
  );
};

// Helper component for stats
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-blue-100">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-800 truncate" title={value}>
        {value}
      </div>
    </div>
  );
};
