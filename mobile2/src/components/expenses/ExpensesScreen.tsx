import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../lib/auth-context";
import { expenseApi } from "../../lib/api-client";
import type { Expense, ExpenseCategoryType } from "../../lib/types";
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    category: "other" as ExpenseCategoryType,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string | null>(
    null
  );

  const categories: {
    value: ExpenseCategoryType;
    label: string;
    emoji: string;
  }[] = [
    { value: "food", label: "Food", emoji: "🍽️" },
    { value: "transport", label: "Transport", emoji: "🚗" },
    { value: "entertainment", label: "Entertainment", emoji: "🎬" },
    { value: "shopping", label: "Shopping", emoji: "🛍️" },
    { value: "utilities", label: "Utilities", emoji: "⚡" },
    { value: "health", label: "Health", emoji: "🏥" },
    { value: "education", label: "Education", emoji: "📚" },
    { value: "travel", label: "Travel", emoji: "✈️" },
    { value: "other", label: "Other", emoji: "📦" },
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = expenseApi.subscribeToExpenseChanges(
      user.id,
      (payload) => {
        console.log("Real-time expense change:", payload);

        if (payload.eventType === "INSERT" && payload.new) {
          // Add new expense to the list
          setExpenses((prev) => {
            const updatedExpenses = [payload.new!, ...prev];
            calculateStats(updatedExpenses);
            return updatedExpenses;
          });
        } else if (payload.eventType === "DELETE" && payload.old) {
          // Remove deleted expense from the list
          setExpenses((prev) => {
            const updatedExpenses = prev.filter(
              (expense) => expense.id !== payload.old!.id
            );
            calculateStats(updatedExpenses);
            return updatedExpenses;
          });
        } else if (payload.eventType === "UPDATE" && payload.new) {
          // Update existing expense in the list
          setExpenses((prev) => {
            const updatedExpenses = prev.map((expense) =>
              expense.id === payload.new!.id ? payload.new! : expense
            );
            calculateStats(updatedExpenses);
            return updatedExpenses;
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const result = await expenseApi.getExpenses();

      if (result.data) {
        setExpenses(result.data);
        calculateStats(result.data);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const calculateStats = (expensesList: Expense[]) => {
    const totalAmount = expensesList.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    setStats({
      totalAmount,
      totalCount: expensesList.length,
    });
  };

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
      0
    );
    const totalCount = filteredExpenses.length;

    return {
      totalAmount,
      totalCount,
    };
  }, [filteredExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryEmoji = (category: string) => {
    const categoryObj = categories.find((c) => c.value === category);
    return categoryObj?.emoji || "📦";
  };

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
              base64: true,
            });

            if (!result.canceled && result.assets[0]) {
              setSelectedPhoto(result.assets[0].uri);
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
              base64: true,
            });

            if (!result.canceled && result.assets[0]) {
              setSelectedPhoto(result.assets[0].uri);
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
      Alert.alert("Error", "Please fill in amount and description");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare photo data if available
      const photoData = selectedPhotoBase64
        ? {
            base64: selectedPhotoBase64,
            mimeType: "image/jpeg",
          }
        : undefined;

      const expenseData = {
        amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        photo: photoData,
      };

      const result = await expenseApi.createExpense(expenseData);

      if (result.data) {
        setShowAddModal(false);
        setFormData({
          amount: "",
          category: "other",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        // Reset photo state
        setSelectedPhoto(null);
        setSelectedPhotoBase64(null);
        // Real-time subscription will handle the update automatically
        Alert.alert("Success", "Expense added successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to add expense");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
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
              if (result.data) {
                // Real-time subscription will handle the update automatically
                Alert.alert("Success", "Expense deleted successfully!");
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Failed to delete expense"
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete expense");
            }
          },
        },
      ]
    );
  };

  const handleExpensePress = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      onPress={() => handleExpensePress(item)}
      onLongPress={() => handleDeleteExpense(item)}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <LinearGradient
            colors={["#4f46e5", "#3b82f6"]}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>
              {getCategoryEmoji(item.category)}
            </Text>
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#1e293b", fontWeight: "600", fontSize: 16 }}>
              {item.description}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginRight: 8,
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                }}
              >
                <Text
                  style={{
                    color: "#4338ca",
                    fontSize: 12,
                    fontWeight: "500",
                    textTransform: "capitalize",
                  }}
                >
                  {item.category}
                </Text>
              </View>
              <Text style={{ color: "#64748b", fontSize: 12 }}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              {item.photo_url && (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginLeft: 8,
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                  }}
                >
                  <Text style={{ color: "#16a34a", fontSize: 12 }}>📷</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Text style={{ color: "#1e293b", fontWeight: "bold", fontSize: 18 }}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ marginTop: 16, color: "#64748b" }}>
            Loading expenses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#1e293b",
            marginBottom: 8,
          }}
        >
          Expenses 💰
        </Text>
        <Text style={{ color: "#64748b" }}>Track and manage your spending</Text>
      </View>

      {/* Stats Cards */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flex: 1,
            marginRight: 8,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <LinearGradient
              colors={["#10b981", "#14b8a6"]}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 18 }}>💰</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 12, color: "#64748b", fontWeight: "500" }}
              >
                Total Spent
              </Text>
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b" }}
              >
                {formatCurrency(filteredStats.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flex: 1,
            marginLeft: 8,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 18 }}>📊</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 12, color: "#64748b", fontWeight: "500" }}
              >
                Transactions
              </Text>
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b" }}
              >
                {filteredStats.totalCount}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter and Export Buttons */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
            <Text style={{ color: "#64748b", fontWeight: "500" }}>Filters</Text>
            {Object.keys(filters).length > 0 && (
              <View
                style={{
                  marginLeft: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#4f46e5",
                }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowExportModal(true)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>📤</Text>
            <Text style={{ color: "#64748b", fontWeight: "500" }}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Expense Button */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["#4f46e5", "#3b82f6"]}
            style={{ paddingVertical: 16, paddingHorizontal: 24 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>➕</Text>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Add New Expense
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Hint */}
      {filteredExpenses.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            Tap to view details • Long press to delete
          </Text>
        </View>
      )}

      {/* Expenses List */}
      <View style={{ flex: 1 }}>
        {filteredExpenses.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
          >
            <Text style={{ fontSize: 64, marginBottom: 16 }}>📝</Text>
            <Text
              style={{
                color: "#64748b",
                textAlign: "center",
                fontSize: 18,
                marginBottom: 8,
              }}
            >
              {expenses.length === 0
                ? "No expenses yet"
                : "No expenses match your filters"}
            </Text>
            <Text style={{ color: "#94a3b8", textAlign: "center" }}>
              {expenses.length === 0
                ? "Start tracking your spending by adding your first expense"
                : "Try adjusting your filters or add a new expense"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4f46e5"
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.2)",
                marginBottom: 16,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setSelectedPhoto(null);
                    setSelectedPhotoBase64(null);
                  }}
                >
                  <Text style={{ color: "#4f46e5", fontSize: 18 }}>Cancel</Text>
                </TouchableOpacity>
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#1e293b" }}
                >
                  Add Expense
                </Text>
                <TouchableOpacity
                  onPress={handleAddExpense}
                  disabled={isSubmitting}
                >
                  <Text
                    style={{
                      color: "#4f46e5",
                      fontSize: 18,
                      fontWeight: "600",
                    }}
                  >
                    {isSubmitting ? "Adding..." : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
              <View style={{ gap: 24 }}>
                {/* Amount Input */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#4f46e5",
                      marginBottom: 8,
                    }}
                  >
                    Amount
                  </Text>
                  <TextInput
                    value={formData.amount}
                    onChangeText={(value) =>
                      setFormData({ ...formData, amount: value })
                    }
                    placeholder="0.00"
                    keyboardType="numeric"
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#1e293b",
                      padding: 0,
                    }}
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Description Input */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#4f46e5",
                      marginBottom: 8,
                    }}
                  >
                    Description
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(value) =>
                      setFormData({ ...formData, description: value })
                    }
                    placeholder="What did you spend on?"
                    style={{
                      fontSize: 16,
                      color: "#1e293b",
                      padding: 0,
                    }}
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Category Selection */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#4f46e5",
                      marginBottom: 12,
                    }}
                  >
                    Category
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        onPress={() =>
                          setFormData({ ...formData, category: category.value })
                        }
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor:
                            formData.category === category.value
                              ? "#4f46e5"
                              : "#cbd5e1",
                          backgroundColor:
                            formData.category === category.value
                              ? "rgba(99, 102, 241, 0.1)"
                              : "rgba(255, 255, 255, 0.6)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "500",
                            color:
                              formData.category === category.value
                                ? "#4338ca"
                                : "#64748b",
                          }}
                        >
                          {category.emoji} {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Date Input */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#4f46e5",
                      marginBottom: 8,
                    }}
                  >
                    Date
                  </Text>
                  <TextInput
                    value={formData.date}
                    onChangeText={(value) =>
                      setFormData({ ...formData, date: value })
                    }
                    placeholder="YYYY-MM-DD"
                    style={{
                      fontSize: 16,
                      color: "#1e293b",
                      padding: 0,
                    }}
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Photo Upload */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#4f46e5",
                      marginBottom: 12,
                    }}
                  >
                    Receipt Photo (Optional)
                  </Text>
                  {!selectedPhoto ? (
                    <TouchableOpacity
                      onPress={handlePhotoSelect}
                      style={{
                        borderWidth: 2,
                        borderStyle: "dashed",
                        borderColor: "#cbd5e1",
                        borderRadius: 8,
                        padding: 24,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
                      <Text
                        style={{
                          color: "#64748b",
                          fontWeight: "500",
                          fontSize: 16,
                        }}
                      >
                        Add Photo
                      </Text>
                      <Text
                        style={{
                          color: "#94a3b8",
                          fontSize: 14,
                          textAlign: "center",
                        }}
                      >
                        Camera or Gallery
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: selectedPhoto }}
                        style={{
                          width: "100%",
                          height: 160,
                          borderRadius: 8,
                          resizeMode: "cover",
                        }}
                      />
                      <TouchableOpacity
                        onPress={handlePhotoRemove}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "#ef4444",
                          borderRadius: 16,
                          padding: 8,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 5,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>

      {/* Filters Modal */}
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

      {/* Expense Detail Modal */}
      <Modal
        visible={showDetailModal && selectedExpense !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.2)",
                marginBottom: 16,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowDetailModal(false);
                    setSelectedExpense(null);
                  }}
                >
                  <Text style={{ color: "#4f46e5", fontSize: 18 }}>Close</Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  Expense Details
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedExpense) {
                      const expenseToDelete = selectedExpense;
                      setShowDetailModal(false);
                      setSelectedExpense(null);
                      setTimeout(
                        () => handleDeleteExpense(expenseToDelete),
                        300
                      );
                    }
                  }}
                >
                  <Text
                    style={{
                      color: "#dc2626",
                      fontSize: 18,
                      fontWeight: "600",
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
              {selectedExpense && (
                <View style={{ gap: 24 }}>
                  {/* Amount */}
                  <View
                    style={{
                      padding: 24,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#64748b",
                        marginBottom: 8,
                      }}
                    >
                      Amount
                    </Text>
                    <Text
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        color: "#1e293b",
                      }}
                    >
                      {formatCurrency(selectedExpense.amount)}
                    </Text>
                  </View>

                  {/* Description */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#4f46e5",
                        marginBottom: 8,
                      }}
                    >
                      Description
                    </Text>
                    <Text style={{ fontSize: 16, color: "#1e293b" }}>
                      {selectedExpense.description}
                    </Text>
                  </View>

                  {/* Category */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#4f46e5",
                        marginBottom: 8,
                      }}
                    >
                      Category
                    </Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={{ fontSize: 24, marginRight: 12 }}>
                        {getCategoryEmoji(selectedExpense.category)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#1e293b",
                          textTransform: "capitalize",
                        }}
                      >
                        {selectedExpense.category}
                      </Text>
                    </View>
                  </View>

                  {/* Date */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#4f46e5",
                        marginBottom: 8,
                      }}
                    >
                      Date
                    </Text>
                    <Text style={{ fontSize: 16, color: "#1e293b" }}>
                      {new Date(selectedExpense.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>

                  {/* Photo if exists */}
                  {selectedExpense.photo_url && (
                    <View
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: "#4f46e5",
                          marginBottom: 8,
                        }}
                      >
                        Receipt Photo
                      </Text>
                      <View style={{ borderRadius: 8, overflow: "hidden" }}>
                        <Image
                          source={{ uri: selectedExpense.photo_url }}
                          style={{
                            width: "100%",
                            height: 200,
                            borderRadius: 8,
                            resizeMode: "cover",
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </SafeAreaView>
  );
};

export default ExpensesScreen;
