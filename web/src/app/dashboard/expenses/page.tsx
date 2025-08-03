"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../lib/auth-context";
import {
  ExpenseApi,
  ExpenseCategory,
  type Expense,
  type ExpenseCategoryType,
} from "shared";
import { apiClient } from "../../../lib/supabase";
import ExpenseFilters, {
  type FilterOptions,
} from "../../../components/expenses/ExpenseFilters";
import ExportModal from "../../../components/expenses/ExportModal";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    category: ExpenseCategory.OTHER as ExpenseCategoryType,
    description: "",
    date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const expenseApi = new ExpenseApi(apiClient);

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Category filter
      if (filters.category && expense.category !== filters.category) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!expense.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Date range filter
      if (filters.startDate) {
        const expenseDate = new Date(expense.date).toISOString().split("T")[0];
        if (expenseDate && expenseDate < filters.startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const expenseDate = new Date(expense.date).toISOString().split("T")[0];
        if (expenseDate && expenseDate > filters.endDate) {
          return false;
        }
      }

      // Amount range filter
      if (
        filters.minAmount !== undefined &&
        expense.amount < filters.minAmount
      ) {
        return false;
      }

      if (
        filters.maxAmount !== undefined &&
        expense.amount > filters.maxAmount
      ) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  // Calculate stats based on filtered expenses
  const filteredStats = useMemo(() => {
    const totalAmount = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    return {
      totalAmount,
      totalCount: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  // Load expenses
  const loadExpenses = async () => {
    setLoading(true);
    try {
      const result = await expenseApi.getExpenses({
        limit: 100,
        offset: 0,
      });

      if (result.data) {
        setExpenses(result.data);

        // Calculate basic stats for all expenses (unfiltered)
        const totalAmount = result.data.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
        setStats({
          totalAmount,
          totalCount: result.data.length,
        });
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    loadExpenses();

    // Only set up subscription if user is available
    if (!user?.id) return;

    console.log("Setting up real-time subscription for user:", user.id);

    // Set up real-time subscription to expenses table
    const subscription = apiClient.client
      .channel("expenses_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time expense change:", payload);
          // Reload expenses when changes occur
          loadExpenses();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from real-time updates");
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate photo
      const { PhotoUploader } = require("shared");
      const validation = PhotoUploader.validatePhoto(file);

      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      setSelectedPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo removal
  const handlePhotoRemove = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById(
      "photo-input"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Handle form submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await expenseApi.createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: new Date(formData.date || new Date()).toISOString(),
        photo: selectedPhoto || undefined,
      });

      if (result.data) {
        // Reset form
        setFormData({
          amount: "",
          category: ExpenseCategory.OTHER,
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setShowAddForm(false);

        // Reload expenses immediately (fallback if real-time doesn't work)
        loadExpenses();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: string, description: string) => {
    if (!confirm(`Are you sure you want to delete "${description}"?`)) {
      return;
    }

    try {
      const result = await expenseApi.deleteExpense(id);

      if (!result.data && result.error) {
        alert("Error: " + result.error);
      } else {
        // Reload expenses immediately (fallback if real-time doesn't work)
        loadExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Capitalize category
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">Track and manage your expenses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Spent (All)
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  All Expenses
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Filtered Amount
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(filteredStats.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Filtered Count
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredStats.totalCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ExpenseFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({})}
        />

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Expenses
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={loadExpenses}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={filteredExpenses.length === 0}
              >
                Export File
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Add Expense Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Expense
              </h3>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as ExpenseCategoryType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ExpenseCategory).map(([key, value]) => (
                      <option key={key} value={value}>
                        {getCategoryEmoji(value)} {formatCategory(value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What did you spend on?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="photo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Receipt Photo (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      id="photo-input"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    {!photoPreview ? (
                      <label
                        htmlFor="photo-input"
                        className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-center">
                          <svg
                            className="mx-auto h-8 w-8 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-blue-600">
                              Click to upload
                            </span>{" "}
                            a photo
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, WebP up to 5MB
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Receipt preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handlePhotoRemove}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💸</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {expenses.length === 0
                  ? "No expenses yet"
                  : "No expenses match your filters"}
              </h3>
              <p className="text-gray-600 mb-4">
                {expenses.length === 0
                  ? "Start tracking your expenses by adding your first one."
                  : "Try adjusting your filters or clear them to see all expenses."}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Your First Expense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          {expense.photo_url && (
                            <img
                              src={expense.photo_url}
                              alt="Receipt"
                              className="w-8 h-8 object-cover rounded mr-3 cursor-pointer"
                              onClick={() =>
                                window.open(expense.photo_url, "_blank")
                              }
                              title="Click to view full image"
                            />
                          )}
                          <span>{expense.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center">
                          {getCategoryEmoji(expense.category)}
                          <span className="ml-2">
                            {formatCategory(expense.category)}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            handleDeleteExpense(expense.id, expense.description)
                          }
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Modal */}
        <ExportModal
          expenses={filteredExpenses}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </div>
  );
}
