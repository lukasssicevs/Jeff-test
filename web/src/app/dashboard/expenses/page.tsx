"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import ResponsiveExpenseTable from "../../../components/expenses/ResponsiveExpenseTable";

// HeroUI Imports
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";

import { Spinner } from "@heroui/spinner";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";

// React Icons
import { IoDownload, IoAdd, IoClose } from "react-icons/io5";
import { HiRefresh } from "react-icons/hi";
import Image from "next/image";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    category: ExpenseCategory.OTHER as ExpenseCategoryType,
    description: "",
    date: new Date().toISOString().split("T")[0],
    photo: null as File | null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [categorySelection, setCategorySelection] = useState<Set<string>>(
    new Set([ExpenseCategory.OTHER]),
  );

  // Sync category selection with form data
  useEffect(() => {
    setCategorySelection(new Set([formData.category]));
  }, [formData.category]);

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

      // Note: Real-time subscriptions would be set up here in a production app
      // For now, we'll rely on manual refresh
      console.log("Real-time subscriptions would be set up here");
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
      console.log("Expenses: Real-time expense change:", payload);

      if (payload.eventType === "INSERT" && payload.new) {
        // Add new expense to the list
        setExpenses((prev) => [payload.new!, ...prev]);
      } else if (payload.eventType === "DELETE" && payload.old) {
        // Remove deleted expense from the list
        setExpenses((prev) =>
          prev.filter((expense) => expense.id !== payload.old!.id),
        );
      } else if (payload.eventType === "UPDATE" && payload.new) {
        // Update existing expense in the list
        setExpenses((prev) =>
          prev.map((expense) =>
            expense.id === payload.new!.id ? payload.new! : expense,
          ),
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, expenseApi]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filters.category && expense.category !== filters.category) {
        return false;
      }

      if (filters.startDate && expense.date < filters.startDate) {
        return false;
      }

      if (filters.endDate && expense.date > filters.endDate) {
        return false;
      }

      if (filters.minAmount && expense.amount < filters.minAmount) {
        return false;
      }

      if (filters.maxAmount && expense.amount > filters.maxAmount) {
        return false;
      }

      if (
        filters.search &&
        !expense.description
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  // Calculate filter stats
  const filteredStats = useMemo(() => {
    const totalAmount = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const totalCount = filteredExpenses.length;

    return {
      totalAmount,
      totalCount,
    };
  }, [filteredExpenses]);

  // Handle add expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await expenseApi.createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        photo: formData.photo || undefined,
      });

      if (result && result.data && !result.error) {
        setFormData({
          amount: "",
          category: ExpenseCategory.OTHER as ExpenseCategoryType,
          description: "",
          date: new Date().toISOString().split("T")[0],
          photo: null,
        });
        setPhotoPreview(null);
        setShowAddForm(false);
        // Real-time subscription will handle the update automatically
      } else {
        console.error(
          "Failed to add expense:",
          result?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });

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
    setFormData({ ...formData, photo: null });
    setPhotoPreview(null);
    // Reset the input
    const fileInput = document.getElementById(
      "photo-input",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: string) => {
    try {
      const result = await expenseApi.deleteExpense(id);
      if (result && !result.error) {
        // Real-time subscription will handle the update automatically
      } else {
        console.error(
          "Failed to delete expense:",
          result?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
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
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format category
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
            Expenses
          </h1>
          <p className="text-slate-600 mt-2">Track and manage your expenses</p>
        </div>

        {/* Filter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-2xl">🔍</span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  Filtered Amount
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-slate-800">
                  {formatCurrency(filteredStats.totalAmount)}
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
                  Filtered Count
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-slate-800">
                  {filteredStats.totalCount}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <ExpenseFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({})}
        />

        {/* Add Expense Form Modal */}
        <Modal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          size="lg"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Add New Expense
            </ModalHeader>
            <ModalBody className="px-4 sm:px-6 py-4">
              <form
                id="expense-form"
                onSubmit={handleAddExpense}
                className="space-y-4 sm:space-y-6"
              >
                <NumberInput
                  label="Amount"
                  placeholder="0.00"
                  value={formData.amount ? parseFloat(formData.amount) : 0}
                  onValueChange={(value: number) =>
                    setFormData({
                      ...formData,
                      amount: value?.toString() || "",
                    })
                  }
                  step={0.01}
                  minValue={0}
                  maxValue={999999}
                  isClearable
                  formatOptions={{
                    style: "currency",
                    currency: "USD",
                  }}
                  description="Enter the expense amount"
                  isRequired
                  variant="bordered"
                  color="primary"
                  size="lg"
                />

                <Select
                  label="Category"
                  placeholder="Select a category"
                  selectedKeys={categorySelection}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected) {
                      setCategorySelection(new Set([selected as string]));
                      setFormData({
                        ...formData,
                        category: selected as ExpenseCategoryType,
                      });
                    }
                  }}
                  isRequired
                  variant="bordered"
                  color="primary"
                  size="lg"
                >
                  {Object.entries(ExpenseCategory).map(([, value]) => (
                    <SelectItem key={value}>
                      {getCategoryEmoji(value)} {formatCategory(value)}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="text"
                  label="Description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  isRequired
                  variant="bordered"
                  color="primary"
                  size="lg"
                />

                <DatePicker
                  label="Date"
                  value={parseDate(formData.date)}
                  onChange={(date) =>
                    setFormData({ ...formData, date: date?.toString() || "" })
                  }
                  showMonthAndYearPickers
                  isRequired
                  variant="bordered"
                  color="primary"
                  size="lg"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Receipt Photo (Optional)
                  </label>
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
                      className="cursor-pointer flex items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="text-center">
                        <svg
                          className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400"
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
                        <p className="mt-2 text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="relative">
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-gray-200"
                        style={{
                          objectFit: "cover",
                          width: "8rem",
                          height: "8rem",
                        }}
                        unoptimized
                      />
                      <Button
                        type="button"
                        onClick={handlePhotoRemove}
                        variant="solid"
                        size="sm"
                        isIconOnly
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
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
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </ModalBody>
            <ModalFooter className="px-4 sm:px-6 py-4 gap-3">
              <Button
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg"
                onPress={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="expense-form"
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
              >
                Add Expense
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Expenses Table */}
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
          <CardBody className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Recent Expenses
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={loadExpenses}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  startContent={<HiRefresh className="w-4 h-4" />}
                >
                  {loading && "Loading..."}
                </Button>
                <Button
                  onClick={() => setShowExportModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                  variant="ghost"
                  size="sm"
                  isDisabled={filteredExpenses.length === 0}
                  startContent={<IoDownload className="w-4 h-4" />}
                  isIconOnly
                />
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                  size="sm"
                  startContent={<IoAdd className="w-4 h-4" />}
                  isIconOnly
                />
              </div>
            </div>
          </CardBody>
          <CardBody className="p-0">
            <div className="px-4 sm:px-6 pb-6">
              <ResponsiveExpenseTable
                expenses={filteredExpenses}
                onDeleteExpense={handleDeleteExpense}
                onImageClick={(url) => setSelectedImage(url || null)}
                formatDate={formatDate}
                formatCategory={formatCategory}
                formatCurrency={formatCurrency}
                getCategoryEmoji={getCategoryEmoji}
              />
            </div>
          </CardBody>
        </Card>

        {/* Image Modal */}
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          size="2xl"
          hideCloseButton
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Receipt Image
            </ModalHeader>
            <ModalBody className="px-4 sm:px-6 py-4">
              {selectedImage && (
                <div className="flex justify-center">
                  <Image
                    src={selectedImage}
                    alt="Receipt full size"
                    width={600}
                    height={400}
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{
                      objectFit: "contain",
                      maxHeight: "70vh",
                    }}
                    unoptimized
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter className="px-4 sm:px-6 py-4 gap-3">
              <Button
                onClick={() => setSelectedImage(null)}
                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg"
              >
                <IoClose className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                as="a"
                href={selectedImage || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
              >
                <IoDownload className="w-4 h-4 mr-2" />
                Open Original
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          expenses={filteredExpenses}
        />
      </div>
    </div>
  );
}
