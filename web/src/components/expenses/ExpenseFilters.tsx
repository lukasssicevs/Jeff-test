"use client";

import React, { useState } from "react";
import { ExpenseCategory, type ExpenseCategoryType } from "shared";

export interface FilterOptions {
  category?: ExpenseCategoryType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface ExpenseFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export default function ExpenseFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ExpenseFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryEmoji = (category: ExpenseCategoryType) => {
    const emojiMap = {
      food: "🍽️",
      transport: "🚗",
      entertainment: "🎬",
      shopping: "🛍️",
      utilities: "💡",
      health: "🏥",
      education: "📚",
      travel: "✈️",
      other: "📝",
    };
    return emojiMap[category] || "📝";
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Filter Toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <span className="mr-1">
                {showFilters ? "Hide" : "Show"} Filters
              </span>
              <span
                className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Description
            </label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search expenses..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "category",
                    e.target.value as ExpenseCategoryType
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.entries(ExpenseCategory).map(([key, value]) => (
                  <option key={key} value={value}>
                    {getCategoryEmoji(value)} {formatCategory(value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.minAmount || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "minAmount",
                    parseFloat(e.target.value) || undefined
                  )
                }
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.maxAmount || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "maxAmount",
                    parseFloat(e.target.value) || undefined
                  )
                }
                placeholder="1000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.category && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getCategoryEmoji(filters.category)}{" "}
                    {formatCategory(filters.category)}
                    <button
                      onClick={() => handleFilterChange("category", undefined)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Search: "{filters.search}"
                    <button
                      onClick={() => handleFilterChange("search", undefined)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(filters.startDate || filters.endDate) && (
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Date: {filters.startDate || "start"} -{" "}
                    {filters.endDate || "end"}
                    <button
                      onClick={() => {
                        handleFilterChange("startDate", undefined);
                        handleFilterChange("endDate", undefined);
                      }}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(filters.minAmount !== undefined ||
                  filters.maxAmount !== undefined) && (
                  <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Amount: ${filters.minAmount || 0} - $
                    {filters.maxAmount || "∞"}
                    <button
                      onClick={() => {
                        handleFilterChange("minAmount", undefined);
                        handleFilterChange("maxAmount", undefined);
                      }}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
