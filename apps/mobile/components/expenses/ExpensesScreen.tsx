import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../../lib/auth-context";
import {
  ExpenseApi,
  ExpenseCategory,
  type Expense,
  type ExpenseCategoryType,
} from "@repo/shared";

// Mobile-specific type for photo data
interface MobilePhotoData {
  base64: string;
  mimeType: string;
}
import { apiClient } from "../../lib/supabase";
import ExpenseFilters, { type FilterOptions } from "./ExpenseFilters";
import ExportModal from "./ExportModal";

const ExpensesScreen = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string | null>(
    null
  );

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
        if (expenseDate < filters.startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const expenseDate = new Date(expense.date).toISOString().split("T")[0];
        if (expenseDate > filters.endDate) {
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

  // Check if filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  // Load expenses
  const loadExpenses = async () => {
    try {
      const result = await expenseApi.getExpenses({
        limit: 100,
        offset: 0,
      });

      if (result.data) {
        setExpenses(result.data);

        // Calculate basic stats
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
      setRefreshing(false);
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
      .channel("mobile_expenses_changes")
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
        console.log("Mobile subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from mobile real-time updates");
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  // Handle form submission
  // Handle photo selection
  const handlePhotoSelect = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library"
        );
        return;
      }

      // Show action sheet for camera or gallery
      Alert.alert("Select Photo", "Choose a photo for your expense", [
        {
          text: "Camera",
          onPress: async () => {
            const cameraPermission =
              await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
              Alert.alert(
                "Permission needed",
                "Please allow access to your camera"
              );
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
              base64: true, // Add this for Supabase compatibility
            });

            if (!result.canceled && result.assets[0]) {
              setSelectedPhoto(result.assets[0].uri);
              // Store the base64 data for upload
              if (result.assets[0].base64) {
                setSelectedPhotoBase64(result.assets[0].base64);
              }
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
              base64: true, // Add this for Supabase compatibility
            });

            if (!result.canceled && result.assets[0]) {
              setSelectedPhoto(result.assets[0].uri);
              // Store the base64 data for upload
              if (result.assets[0].base64) {
                setSelectedPhotoBase64(result.assets[0].base64);
              }
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } catch (error) {
      console.error("Error selecting photo:", error);
      Alert.alert("Error", "Failed to select photo");
    }
  };

  // Handle photo removal
  const handlePhotoRemove = () => {
    setSelectedPhoto(null);
    setSelectedPhotoBase64(null);
  };

  const handleAddExpense = async () => {
    if (!formData.amount || !formData.description) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      let photoData: MobilePhotoData | undefined;

      // Prepare photo data if photo is selected
      if (selectedPhoto && selectedPhotoBase64) {
        // Determine MIME type based on file extension or default to JPEG
        let mimeType = "image/jpeg";
        if (selectedPhoto.toLowerCase().includes(".png")) {
          mimeType = "image/png";
        } else if (selectedPhoto.toLowerCase().includes(".webp")) {
          mimeType = "image/webp";
        } else if (selectedPhoto.toLowerCase().includes(".heic")) {
          mimeType = "image/heic";
        }

        photoData = {
          base64: selectedPhotoBase64,
          mimeType: mimeType,
        };

        console.log("Mobile photo prepared:", {
          originalUri: selectedPhoto,
          mimeType,
          base64Length: selectedPhotoBase64.length,
        });
      }

      console.log("About to create expense with photo:", {
        hasPhoto: !!photoData,
        base64Length: photoData?.base64.length,
        mimeType: photoData?.mimeType,
      });

      const result = await expenseApi.createExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: new Date(formData.date || new Date()).toISOString(),
        photo: photoData,
      });

      console.log("Expense creation result:", {
        success: !!result.data,
        error: result.error,
        hasPhotoUrl: !!result.data?.photo_url,
        photoUrl: result.data?.photo_url,
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
        setSelectedPhotoBase64(null);
        setShowAddModal(false);

        // Reload expenses immediately
        loadExpenses();
        Alert.alert("Success", "Expense added successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense");
    }
  };

  // Handle delete expense
  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await expenseApi.deleteExpense(expense.id);

              if (!result.data && result.error) {
                Alert.alert("Error", result.error);
              } else {
                // Reload expenses immediately
                loadExpenses();
                Alert.alert("Success", "Expense deleted successfully!");
              }
            } catch (error) {
              console.error("Error deleting expense:", error);
              Alert.alert("Error", "Failed to delete expense");
            }
          },
        },
      ]
    );
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

  // Render expense item
  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      onLongPress={() => handleDeleteExpense(item)}
      className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="text-xl mr-2">
              {getCategoryEmoji(item.category)}
            </Text>
            <Text className="text-lg font-semibold text-gray-900 flex-1">
              {item.description}
            </Text>
            <Text className="text-lg font-bold text-green-600">
              {formatCurrency(item.amount)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">
              {formatCategory(item.category)}
            </Text>
            <Text className="text-sm text-gray-500">
              {formatDate(item.date)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading expenses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Expenses</Text>
        <Text className="text-gray-600">Track and manage your expenses</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="flex-row flex-wrap gap-3 mb-4">
            <View className="bg-white p-4 rounded-xl shadow-sm flex-1 mr-1">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lg">💰</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 font-medium">
                    All Spent
                  </Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(stats.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white p-4 rounded-xl shadow-sm flex-1 ml-1">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lg">📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 font-medium">
                    All Count
                  </Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {stats.totalCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="bg-white p-4 rounded-xl shadow-sm flex-1 mr-1">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-orange-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lg">🔍</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 font-medium">
                    Filtered
                  </Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(filteredStats.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white p-4 rounded-xl shadow-sm flex-1 ml-1">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center mr-3">
                  <Text className="text-lg">📈</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 font-medium">
                    Showing
                  </Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {filteredStats.totalCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3 mb-4">
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={onRefresh}
                disabled={refreshing}
                className="flex-1 bg-gray-600 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                className={`flex-1 py-3 rounded-xl ${
                  hasActiveFilters ? "bg-orange-600" : "bg-purple-600"
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  {hasActiveFilters ? "Filters ●" : "Filters"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-1 bg-blue-600 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowExportModal(true)}
              disabled={filteredExpenses.length === 0}
              className={`py-3 rounded-xl ${
                filteredExpenses.length === 0 ? "bg-gray-400" : "bg-green-600"
              }`}
            >
              <Text className="text-white text-center font-semibold">
                📤 Export Report
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <View className="bg-white p-8 rounded-xl shadow-sm items-center">
              <Text className="text-4xl mb-4">💸</Text>
              <Text className="text-lg font-medium text-gray-900 mb-2">
                {expenses.length === 0
                  ? "No expenses yet"
                  : "No expenses match your filters"}
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                {expenses.length === 0
                  ? "Start tracking your expenses by adding your first one."
                  : "Try adjusting your filters or clear them to see all expenses."}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">
                  Add Your First Expense
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <ExpenseFilters
        filters={filters}
        onFiltersChange={setFilters}
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Export Modal */}
      <ExportModal
        expenses={filteredExpenses}
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="bg-white px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text className="text-blue-600 text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Add Expense
              </Text>
              <TouchableOpacity onPress={handleAddExpense}>
                <Text className="text-blue-600 text-lg font-semibold">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 p-6">
            <View className="space-y-6">
              {/* Amount */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </Text>
                <TextInput
                  value={formData.amount}
                  onChangeText={(text) =>
                    setFormData({ ...formData, amount: text })
                  }
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-lg"
                />
              </View>

              {/* Category */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-3">
                    {Object.entries(ExpenseCategory).map(([key, value]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() =>
                          setFormData({ ...formData, category: value })
                        }
                        className={`px-4 py-3 rounded-lg border ${
                          formData.category === value
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <View className="items-center">
                          <Text className="text-lg mb-1">
                            {getCategoryEmoji(value)}
                          </Text>
                          <Text
                            className={`text-xs font-medium ${
                              formData.category === value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {formatCategory(value)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Description */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Description *
                </Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="What did you spend on?"
                  multiline
                  numberOfLines={3}
                  className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                />
              </View>

              {/* Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Date
                </Text>
                <TextInput
                  value={formData.date}
                  onChangeText={(text) =>
                    setFormData({ ...formData, date: text })
                  }
                  placeholder="YYYY-MM-DD"
                  className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                />
              </View>

              {/* Photo Upload */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Receipt Photo (Optional)
                </Text>
                {!selectedPhoto ? (
                  <TouchableOpacity
                    onPress={handlePhotoSelect}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center justify-center bg-gray-50"
                  >
                    <Text className="text-4xl mb-2">📷</Text>
                    <Text className="text-gray-600 font-medium">Add Photo</Text>
                    <Text className="text-gray-500 text-sm">
                      Camera or Gallery
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View className="relative">
                    <Image
                      source={{ uri: selectedPhoto }}
                      className="w-full h-40 rounded-lg"
                      style={{ resizeMode: "cover" }}
                    />
                    <TouchableOpacity
                      onPress={handlePhotoRemove}
                      className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                    >
                      <Text className="text-white font-bold">✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ExpensesScreen;
