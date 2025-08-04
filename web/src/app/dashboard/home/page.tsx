"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../lib/auth-context";
import Link from "next/link";
import {
  ExpenseApi,
  type Expense,
  type ExpenseCategoryType,
  formatCurrency,
  formatCategory,
} from "shared";
import { apiClient } from "../../../lib/supabase";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import ExportModal from "../../../components/expenses/ExportModal";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Utility functions (defined before usage)

  const getCategoryEmoji = useCallback((category: ExpenseCategoryType) => {
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
  }, []);

  const expenseApi = useMemo(() => new ExpenseApi(apiClient), []);

  // Load expenses
  const loadExpenses = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await expenseApi.getExpenses({
        limit: 100,
        offset: 0,
      });

      if (result.data) {
        setExpenses(result.data);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [user, expenseApi]);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user, loadExpenses]);

  // Refresh data when page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadExpenses();
      }
    };

    const handleFocus = () => {
      if (user) {
        loadExpenses();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, loadExpenses]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = expenseApi.subscribeToExpenseChanges((payload) => {
      console.log("Home: Real-time expense change:", payload);
      // Reload expenses when any change occurs
      loadExpenses();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, expenseApi, loadExpenses]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate this month's spending
    const thisMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    const thisMonthAmount = thisMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    // Calculate daily average for this month
    const currentDay = now.getDate();
    const dailyAverage = thisMonthAmount / currentDay;

    // Find most popular category
    const categoryCount: Record<string, number> = {};
    expenses.forEach((expense) => {
      categoryCount[expense.category] =
        (categoryCount[expense.category] || 0) + 1;
    });

    const mostPopularCategory = Object.entries(categoryCount).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      thisMonthAmount,
      totalEntries: expenses.length,
      dailyAverage: isNaN(dailyAverage) ? 0 : dailyAverage,
      mostPopularCategory: mostPopularCategory
        ? {
            name: formatCategory(mostPopularCategory[0]),
            emoji: getCategoryEmoji(
              mostPopularCategory[0] as ExpenseCategoryType,
            ),
            count: mostPopularCategory[1],
          }
        : null,
    };
  }, [expenses, formatCategory, getCategoryEmoji]);

  // Calculate category data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: formatCategory(category),
      value: amount,
      emoji: getCategoryEmoji(category as ExpenseCategoryType),
    }));
  }, [expenses, formatCategory, getCategoryEmoji]);

  // Calculate daily data for past 3 months
  const dailyData = useMemo(() => {
    if (expenses.length === 0) {
      return [];
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days = ~3 months

    // Group expenses by date (last 3 months only)
    const dailyTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);

      // Only include expenses from the last 3 months
      if (expenseDate >= threeMonthsAgo && expenseDate <= now) {
        const dateKey = expense.date; // YYYY-MM-DD format
        dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + expense.amount;
      }
    });

    // Convert to chart data and sort by date
    const chartData = Object.entries(dailyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        amount,
        fullDate: date,
      }));

    return chartData;
  }, [expenses]);

  // Calculate Y-axis domain for dynamic scaling
  const yAxisDomain = useMemo(() => {
    if (dailyData.length === 0) return [0, 100];

    const amounts = dailyData.map((d) => d.amount);
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);

    // If all amounts are 0, show a small scale
    if (maxAmount === 0) return [0, 10];

    // Add 10% padding above and below for better visualization
    const padding = maxAmount * 0.1;
    const yMin = Math.max(0, minAmount - padding); // Don't go below 0
    const yMax = maxAmount + padding;

    return [Math.floor(yMin), Math.ceil(yMax)];
  }, [dailyData]);

  const COLORS = [
    "#3b82f6", // Blue - Primary
    "#10b981", // Emerald - Success
    "#f59e0b", // Amber - Warning
    "#8b5cf6", // Purple - Premium
    "#06b6d4", // Cyan - Fresh
    "#ef4444", // Red - Alert
    "#84cc16", // Lime - Growth
    "#f97316", // Orange - Energy
    "#ec4899", // Pink - Accent
    "#14b8a6", // Teal - Balance
    "#6366f1", // Indigo - Professional
    "#22c55e", // Green - Positive
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 mt-2">Welcome back, {user?.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-2xl">💰</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  Spent This Month
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-slate-800">
                  {formatCurrency(stats.thisMonthAmount)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-2xl">📊</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  Total Entries
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-slate-800">
                  {stats.totalEntries}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-2xl">📈</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  Daily Avg
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-slate-800">
                  {formatCurrency(stats.dailyAverage)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-2xl">
                  {stats.mostPopularCategory?.emoji || "🎯"}
                </span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  Top Category
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-slate-800">
                  {stats.mostPopularCategory?.name || "None"}
                </p>
                {stats.mostPopularCategory && (
                  <p className="text-xs text-slate-500">
                    {stats.mostPopularCategory.count} entries
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Spending by Category */}
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                Spending by Category
              </h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📊</span>
                    <p className="text-slate-600">No expense data yet</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Daily Spending (Past Month) */}
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                Daily Spending (Last 3 Months)
              </h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={yAxisDomain}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Amount",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: "#3b82f6",
                        strokeWidth: 2,
                        fill: "#ffffff",
                      }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📈</span>
                    <p className="text-slate-600">No expense data yet</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Link href="/dashboard/expenses">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90">
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-lg sm:text-2xl">💰</span>
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                      Manage Expenses
                    </h3>
                    <p className="text-sm text-slate-600">
                      View, add, and track your expenses
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>

          <Card
            className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90"
            isPressable
            onPress={() => {
              console.log("Export card clicked!");
              setShowExportModal(true);
            }}
          >
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-lg sm:text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Export Data
                  </h3>
                  <p className="text-slate-600">Download expense reports</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          expenses={expenses}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </div>
  );
}
