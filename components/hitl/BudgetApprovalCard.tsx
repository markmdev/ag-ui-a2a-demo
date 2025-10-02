/**
 * BudgetApprovalCard Component
 *
 * A Human-in-the-Loop (HITL) component for budget approval workflow.
 * Displays the travel budget breakdown and allows the user to approve or reject it.
 *
 * Features:
 * - Visual budget summary with total
 * - Category breakdown with amounts and percentages
 * - Approve/Reject buttons
 * - State management for approval/rejection
 * - Visual feedback for approved/rejected states
 *
 * This component demonstrates the HITL pattern where the agent workflow
 * pauses and waits for explicit user approval before proceeding.
 */

import React from "react";
import { BudgetData } from "../types";

interface BudgetApprovalCardProps {
  budgetData: BudgetData;
  isApproved: boolean;
  isRejected: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const BudgetApprovalCard: React.FC<BudgetApprovalCardProps> = ({
  budgetData,
  isApproved,
  isRejected,
  onApprove,
  onReject,
}) => {
  /**
   * Format currency values consistently
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: budgetData.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6 my-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">💰</div>
        <div>
          <h3 className="text-xl font-bold text-amber-900">Budget Approval Required</h3>
          <p className="text-sm text-amber-700">Please review and approve the estimated budget</p>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 font-medium">Total Budget</span>
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(budgetData.totalBudget)}
          </span>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {budgetData.breakdown?.map((category, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{category.category}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {formatCurrency(category.amount)}
                </span>
                <span className="text-gray-400">({category.percentage.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {budgetData.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">{budgetData.notes}</p>
          </div>
        )}
      </div>

      {/* Rejection Message */}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-lg">❌</span>
            <div>
              <p className="font-semibold text-sm">Budget Rejected</p>
              <p className="text-xs text-red-700">
                The agent has been notified and may revise the budget based on your feedback.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={isApproved || isRejected}
          className={`flex-1 text-xs font-semibold py-1 px-3 rounded transition-all ${
            isApproved
              ? "bg-green-600 text-white cursor-not-allowed"
              : isRejected
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isApproved ? "✓ Approved" : "Approve Budget"}
        </button>
        <button
          onClick={onReject}
          disabled={isApproved || isRejected}
          className={`flex-1 text-xs font-semibold py-1 px-3 rounded transition-all ${
            isRejected
              ? "bg-red-800 text-white cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {isRejected ? "✗ Rejected" : "Reject"}
        </button>
      </div>
    </div>
  );
};
