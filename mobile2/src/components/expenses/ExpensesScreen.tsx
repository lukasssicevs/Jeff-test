import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";
import { expenseApi } from "../../lib/api-client";
import type { Expense, ExpenseCategoryType } from "../../lib/types";

const ExpensesScreen = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
      const result = await expenseApi.createExpense({
        amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
      });

      if (result.data) {
        setShowAddModal(false);
        setFormData({
          amount: "",
          category: "other",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
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

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
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
                {formatCurrency(stats.totalAmount)}
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
                {stats.totalCount}
              </Text>
            </View>
          </View>
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

      {/* Expenses List */}
      <View style={{ flex: 1 }}>
        {expenses.length === 0 ? (
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
              No expenses yet
            </Text>
            <Text style={{ color: "#94a3b8", textAlign: "center" }}>
              Start tracking your spending by adding your first expense
            </Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
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
        <SafeAreaView style={{ flex: 1 }}>
          <LinearGradient
            colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
            style={{ flex: 1 }}
          >
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
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
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
              </View>
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ExpensesScreen;
