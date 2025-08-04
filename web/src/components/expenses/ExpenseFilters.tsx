"use client";

import React, { useState, useEffect } from "react";
import { ExpenseCategory, type ExpenseCategoryType } from "shared";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";

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
  const [categorySelection, setCategorySelection] = useState<Set<string>>(
    new Set(),
  );

  // Sync category selection with filters
  useEffect(() => {
    if (filters.category) {
      setCategorySelection(new Set([filters.category]));
    } else {
      setCategorySelection(new Set());
    }
  }, [filters.category]);

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null,
  );

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | number | undefined,
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  // Get category emoji
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

  // Format category name
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Card className="shadow-lg mb-8 bg-white/80 backdrop-blur-sm border border-white/20">
      {/* Filter Toggle Header */}
      <CardHeader className="px-6 py-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Chip color="primary" variant="flat" size="sm">
                {
                  Object.values(filters).filter(
                    (v) => v !== undefined && v !== "" && v !== null,
                  ).length
                }{" "}
                active
              </Chip>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button
                color="danger"
                variant="light"
                size="sm"
                onPress={onClearFilters}
              >
                Clear All
              </Button>
            )}
            <Button
              color="primary"
              variant="light"
              size="sm"
              onPress={() => setShowFilters(!showFilters)}
              isIconOnly
              title={showFilters ? "Hide Filters" : "Show Filters"}
            >
              <span
                className={`transform transition-transform duration-200 text-black ${
                  showFilters ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Filter Content */}
      {showFilters && (
        <CardBody className="px-6 pt-0 pb-6">
          <div className="space-y-8">
            {/* Search Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Search</h4>
              <Input
                type="text"
                label="Search Description"
                placeholder="Search expenses..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                variant="bordered"
                color="primary"
                isClearable
                onClear={() => handleFilterChange("search", "")}
                startContent={
                  <svg
                    className="h-4 w-4 text-default-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>

            <Divider className="my-6" />

            {/* Category and Date Filters */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Category & Date Range
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Category Filter */}
                <Select
                  label="Category"
                  placeholder="All categories"
                  selectedKeys={categorySelection}
                  onSelectionChange={(selection) => {
                    setCategorySelection(selection as Set<string>);
                    const selected = Array.from(selection)[0];
                    handleFilterChange("category", selected || "");
                  }}
                  variant="bordered"
                  color="primary"
                >
                  {Object.entries(ExpenseCategory).map(([, value]) => (
                    <SelectItem key={value}>
                      {getCategoryEmoji(value)} {formatCategory(value)}
                    </SelectItem>
                  ))}
                </Select>

                {/* Start Date */}
                <DatePicker
                  label="Start Date"
                  value={
                    filters.startDate ? parseDate(filters.startDate) : null
                  }
                  onChange={(date) => {
                    const dateString = date ? date.toString() : "";
                    handleFilterChange("startDate", dateString);
                  }}
                  variant="bordered"
                  color="primary"
                  showMonthAndYearPickers
                />

                {/* End Date */}
                <DatePicker
                  label="End Date"
                  value={filters.endDate ? parseDate(filters.endDate) : null}
                  onChange={(date) => {
                    const dateString = date ? date.toString() : "";
                    handleFilterChange("endDate", dateString);
                  }}
                  variant="bordered"
                  color="primary"
                  showMonthAndYearPickers
                />
              </div>
            </div>

            <Divider className="my-6" />

            {/* Amount Range Filters */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Amount Range
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Min Amount */}
                <NumberInput
                  label="Minimum Amount"
                  placeholder="0.00"
                  value={filters.minAmount || 0}
                  onValueChange={(value: number) =>
                    handleFilterChange("minAmount", value || undefined)
                  }
                  variant="bordered"
                  color="primary"
                  step={0.1}
                  minValue={0}
                  maxValue={999999.99}
                  isClearable
                  formatOptions={{
                    style: "currency",
                    currency: "USD",
                  }}
                  description="Enter minimum expense amount"
                />

                {/* Max Amount */}
                <NumberInput
                  label="Maximum Amount"
                  placeholder="999999.99"
                  value={filters.maxAmount || 0}
                  onValueChange={(value: number) =>
                    handleFilterChange("maxAmount", value || undefined)
                  }
                  variant="bordered"
                  color="primary"
                  step={0.1}
                  minValue={0}
                  maxValue={999999.99}
                  isClearable
                  formatOptions={{
                    style: "currency",
                    currency: "USD",
                  }}
                  description="Enter maximum expense amount"
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <>
                <Divider className="my-6" />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Active Filters
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() => handleFilterChange("search", "")}
                        size="sm"
                      >
                        Search: &quot;{filters.search}&quot;
                      </Chip>
                    )}
                    {filters.category && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() => handleFilterChange("category", "")}
                        size="sm"
                      >
                        {getCategoryEmoji(filters.category)}{" "}
                        {formatCategory(filters.category)}
                      </Chip>
                    )}
                    {filters.startDate && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() => handleFilterChange("startDate", "")}
                        size="sm"
                      >
                        From: {filters.startDate}
                      </Chip>
                    )}
                    {filters.endDate && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() => handleFilterChange("endDate", "")}
                        size="sm"
                      >
                        To: {filters.endDate}
                      </Chip>
                    )}
                    {filters.minAmount !== undefined && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() =>
                          handleFilterChange("minAmount", undefined)
                        }
                        size="sm"
                      >
                        Min: ${filters.minAmount}
                      </Chip>
                    )}
                    {filters.maxAmount !== undefined && (
                      <Chip
                        color="primary"
                        variant="flat"
                        onClose={() =>
                          handleFilterChange("maxAmount", undefined)
                        }
                        size="sm"
                      >
                        Max: ${filters.maxAmount}
                      </Chip>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardBody>
      )}
    </Card>
  );
}
