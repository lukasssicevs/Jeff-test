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

// HeroUI Imports
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/react";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { IoDownload, IoAdd, IoClose, IoTrash } from "react-icons/io5";
import { HiRefresh } from "react-icons/hi";
import Image from "next/image";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    category: ExpenseCategory.OTHER as ExpenseCategoryType,
    description: "",
    date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [categorySelection, setCategorySelection] = useState<Set<string>>(
    new Set([ExpenseCategory.OTHER])
  );

  const expenseApi = useMemo(() => new ExpenseApi(apiClient), []);

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
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await expenseApi.getExpenses({
        limit: 100,
        offset: 0,
      });

      if (result.data) {
        setExpenses(result.data);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [expenseApi]);

  // Set up real-time subscription
  useEffect(() => {
    if (user) {
      loadExpenses();
    }

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
  }, [user?.id, user, loadExpenses]);

  // Handle photo selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate photo
      const { PhotoUploader } = await import("shared");
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
  const handleDeleteExpense = async (id: string) => {
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
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
          <p className="text-slate-600 mt-2">Track and manage your expenses</p>
        </div>

        {/* Filter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Filtered Amount
                </p>
                <p className="text-2xl font-semibold text-slate-800">
                  {formatCurrency(filteredStats.totalAmount)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
            <CardBody className="flex flex-row items-center p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Filtered Count
                </p>
                <p className="text-2xl font-semibold text-slate-800">
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
            <ModalBody className="px-6 py-4">
              <form
                id="expense-form"
                onSubmit={handleAddExpense}
                className="space-y-6"
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
                  variant="bordered"
                  isRequired
                  step={0.01}
                  minValue={0}
                  maxValue={999999.99}
                  formatOptions={{
                    style: "currency",
                    currency: "USD",
                  }}
                  description="Enter the expense amount in USD"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                />

                <Select
                  label="Category"
                  placeholder="Select a category"
                  selectedKeys={categorySelection}
                  onSelectionChange={(keys) => {
                    setCategorySelection(keys as Set<string>);
                    const selectedKey = Array.from(keys)[0];
                    if (selectedKey) {
                      setFormData({
                        ...formData,
                        category: selectedKey as ExpenseCategoryType,
                      });
                    }
                  }}
                  variant="bordered"
                  isRequired
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
                  placeholder="What did you spend on?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  variant="bordered"
                  isRequired
                />

                <DatePicker
                  label="Date"
                  value={formData.date ? parseDate(formData.date) : null}
                  onChange={(date) => {
                    const dateString = date
                      ? date.toString()
                      : new Date().toISOString().split("T")[0];
                    setFormData({ ...formData, date: dateString });
                  }}
                  variant="bordered"
                  isRequired
                  showMonthAndYearPickers
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Receipt Photo (Optional)
                  </label>
                  <div>
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
                        className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
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
                        <Image
                          src={photoPreview}
                          alt="Receipt preview"
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          style={{
                            width: "100%",
                            height: "8rem",
                            objectFit: "cover",
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
                </div>
              </form>
            </ModalBody>
            <ModalFooter className="px-6 py-4 gap-3">
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

        {/* Expenses Table with Action Bar */}
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
          {/* Action Bar Header */}
          <CardBody className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Expenses
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={loadExpenses}
                  color="default"
                  variant="ghost"
                  size="sm"
                  isDisabled={loading}
                  isLoading={loading}
                  startContent={!loading && <HiRefresh className="w-4 h-4" />}
                  isIconOnly={!loading}
                  title="Refresh expenses"
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
                  title="Export expenses"
                />
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                  variant="ghost"
                  size="sm"
                  startContent={<IoAdd className="w-4 h-4" />}
                  isIconOnly
                  title="Add new expense"
                />
              </div>
            </div>
          </CardBody>
          <CardBody className="p-0">
            {filteredExpenses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">💸</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {expenses.length === 0
                    ? "No expenses yet"
                    : "No expenses match your filters"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {expenses.length === 0
                    ? "Start tracking your expenses by adding your first one."
                    : "Try adjusting your filters or clear them to see all expenses."}
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                  variant="solid"
                  size="lg"
                >
                  Add Your First Expense
                </Button>
              </div>
            ) : (
              <div className="p-0">
                <Table
                  aria-label="Expenses table"
                  className="min-h-[400px]"
                  removeWrapper
                >
                  <TableHeader>
                    <TableColumn
                      key="date"
                      className="bg-gray-50 text-gray-700 font-semibold px-6 py-4"
                    >
                      Date
                    </TableColumn>
                    <TableColumn
                      key="description"
                      className="bg-gray-50 text-gray-700 font-semibold px-6 py-4"
                    >
                      Description
                    </TableColumn>
                    <TableColumn
                      key="category"
                      className="bg-gray-50 text-gray-700 font-semibold px-6 py-4"
                    >
                      Category
                    </TableColumn>
                    <TableColumn
                      key="amount"
                      className="bg-gray-50 text-gray-700 font-semibold px-6 py-4"
                    >
                      Amount
                    </TableColumn>
                    <TableColumn
                      key="image"
                      className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 text-center"
                    >
                      Image
                    </TableColumn>
                    <TableColumn
                      key="actions"
                      className="bg-gray-50 text-gray-700 font-semibold px-6 py-4"
                    >
                      Delete
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {formatDate(expense.date)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-sm text-gray-900 truncate max-w-xs">
                            {expense.description}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Chip
                            variant="flat"
                            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                            size="sm"
                            startContent={
                              <span>{getCategoryEmoji(expense.category)}</span>
                            }
                          >
                            {formatCategory(expense.category)}
                          </Chip>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center w-full">
                            {expense.photo_url ? (
                              <div
                                className="cursor-pointer"
                                onClick={() =>
                                  setSelectedImage(expense.photo_url!)
                                }
                                title="Click to view full image"
                              >
                                <Image
                                  src={expense.photo_url}
                                  alt="Receipt"
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform shadow-sm block"
                                  onLoad={() =>
                                    console.log(
                                      "Image loaded:",
                                      expense.photo_url
                                    )
                                  }
                                  onError={(e) =>
                                    console.log(
                                      "Image error:",
                                      expense.photo_url,
                                      e
                                    )
                                  }
                                  unoptimized
                                  priority={false}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                            variant="light"
                            size="sm"
                            isIconOnly
                            title="Delete expense"
                          >
                            <IoTrash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Export Modal */}
        <ExportModal
          expenses={filteredExpenses}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />

        {/* Image Modal */}
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          size="2xl"
          scrollBehavior="inside"
          hideCloseButton
        >
          <ModalContent>
            <ModalHeader className="flex justify-between items-center">
              <span>Expense Receipt</span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSelectedImage(null)}
              >
                <IoClose className="w-4 h-4" />
              </Button>
            </ModalHeader>
            <ModalBody className="px-6 py-4">
              {selectedImage && (
                <div className="flex justify-center">
                  <Image
                    src={selectedImage}
                    alt="Expense Receipt"
                    width={800}
                    height={600}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "70vh",
                    }}
                    unoptimized
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter className="px-6 py-4">
              <Button
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                variant="light"
                onPress={() =>
                  selectedImage && window.open(selectedImage, "_blank")
                }
                startContent={<IoDownload className="w-4 h-4" />}
              >
                Open Original
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                variant="light"
                onPress={() => setSelectedImage(null)}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
