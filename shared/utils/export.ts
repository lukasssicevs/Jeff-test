import { Expense, ExpenseCategoryType } from "../types/expense.js";

export interface ExportOptions {
  format: "csv" | "json" | "summary";
  includeHeaders?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
  categories?: ExpenseCategoryType[];
}

export interface ExportSummary {
  totalAmount: number;
  totalCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  categorySummary: Record<string, { amount: number; count: number }>;
  expenses: Expense[];
}

export class ExpenseExporter {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  static formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  static generateSummary(expenses: Expense[]): ExportSummary {
    if (expenses.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        dateRange: { start: "", end: "" },
        categorySummary: {},
        expenses: [],
      };
    }

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const totalCount = expenses.length;

    // Sort expenses by date to get range
    const sortedExpenses = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const dateRange = {
      start:
        sortedExpenses.length > 0
          ? this.formatDate(sortedExpenses[0]!.date)
          : "",
      end:
        sortedExpenses.length > 0
          ? this.formatDate(sortedExpenses[sortedExpenses.length - 1]!.date)
          : "",
    };

    // Calculate category summary
    const categorySummary: Record<string, { amount: number; count: number }> =
      {};
    expenses.forEach((expense) => {
      const category = this.formatCategory(expense.category);
      if (!categorySummary[category]) {
        categorySummary[category] = { amount: 0, count: 0 };
      }
      categorySummary[category].amount += expense.amount;
      categorySummary[category].count += 1;
    });

    return {
      totalAmount,
      totalCount,
      dateRange,
      categorySummary,
      expenses,
    };
  }

  static exportToCSV(
    expenses: Expense[],
    options: ExportOptions = { format: "csv" },
  ): string {
    const summary = this.generateSummary(expenses);
    let csv = "";

    // Add header if requested
    if (options.includeHeaders !== false) {
      csv += "# Expense Report\n";
      csv += `# Generated: ${new Date().toLocaleDateString()}\n`;
      csv += `# Total Amount: ${this.formatCurrency(summary.totalAmount)}\n`;
      csv += `# Total Expenses: ${summary.totalCount}\n`;
      if (summary.dateRange.start && summary.dateRange.end) {
        csv += `# Date Range: ${summary.dateRange.start} - ${summary.dateRange.end}\n`;
      }
      csv += "#\n";
    }

    // CSV Headers
    csv += "Date,Description,Category,Amount\n";

    // CSV Data
    expenses.forEach((expense) => {
      const date = this.formatDate(expense.date);
      const description = expense.description.replace(/"/g, '""'); // Escape quotes
      const category = this.formatCategory(expense.category);
      const amount = expense.amount.toFixed(2);

      csv += `"${date}","${description}","${category}","$${amount}"\n`;
    });

    // Add summary section
    if (options.includeHeaders !== false) {
      csv += "\n# Category Summary\n";
      csv += "Category,Count,Total Amount\n";
      Object.entries(summary.categorySummary).forEach(([category, data]) => {
        csv += `"${category}",${data.count},"$${data.amount.toFixed(2)}"\n`;
      });
    }

    return csv;
  }

  static exportToJSON(
    expenses: Expense[],
    options: ExportOptions = { format: "json" },
  ): string {
    const summary = this.generateSummary(expenses);

    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalAmount: summary.totalAmount,
        totalCount: summary.totalCount,
        dateRange: summary.dateRange,
        format: "Expense Export JSON v1.0",
      },
      summary: {
        totalAmount: summary.totalAmount,
        totalCount: summary.totalCount,
        averageAmount:
          summary.totalCount > 0 ? summary.totalAmount / summary.totalCount : 0,
        categorySummary: summary.categorySummary,
      },
      expenses: expenses.map((expense) => ({
        id: expense.id,
        date: expense.date,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        formattedAmount: this.formatCurrency(expense.amount),
        formattedDate: this.formatDate(expense.date),
        formattedCategory: this.formatCategory(expense.category),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportToSummary(expenses: Expense[]): string {
    const summary = this.generateSummary(expenses);

    let report = "EXPENSE REPORT SUMMARY\n";
    report += "=" + "=".repeat(50) + "\n\n";

    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    if (summary.dateRange.start && summary.dateRange.end) {
      report += `Period: ${summary.dateRange.start} - ${summary.dateRange.end}\n`;
    }
    report += `Total Expenses: ${summary.totalCount}\n`;
    report += `Total Amount: ${this.formatCurrency(summary.totalAmount)}\n`;
    if (summary.totalCount > 0) {
      report += `Average Amount: ${this.formatCurrency(summary.totalAmount / summary.totalCount)}\n`;
    }
    report += "\n";

    // Category breakdown
    if (Object.keys(summary.categorySummary).length > 0) {
      report += "CATEGORY BREAKDOWN\n";
      report += "-".repeat(30) + "\n";

      Object.entries(summary.categorySummary)
        .sort((a, b) => b[1].amount - a[1].amount) // Sort by amount descending
        .forEach(([category, data]) => {
          const percentage = (
            (data.amount / summary.totalAmount) *
            100
          ).toFixed(1);
          report += `${category.padEnd(15)} ${data.count.toString().padStart(3)} expenses  ${this.formatCurrency(data.amount).padStart(10)} (${percentage}%)\n`;
        });
      report += "\n";
    }

    // Recent expenses (top 10)
    if (expenses.length > 0) {
      report += "RECENT EXPENSES (Top 10)\n";
      report += "-".repeat(30) + "\n";

      const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      recentExpenses.forEach((expense) => {
        const date = this.formatDate(expense.date).padEnd(12);
        const category = this.formatCategory(expense.category).padEnd(12);
        const amount = this.formatCurrency(expense.amount).padStart(10);
        report += `${date} ${category} ${amount} ${expense.description}\n`;
      });
    }

    return report;
  }

  static export(expenses: Expense[], options: ExportOptions): string {
    switch (options.format) {
      case "csv":
        return this.exportToCSV(expenses, options);
      case "json":
        return this.exportToJSON(expenses, options);
      case "summary":
        return this.exportToSummary(expenses);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  static getFileName(format: "csv" | "json" | "summary"): string {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return `expense-report-${timestamp}.${format === "summary" ? "txt" : format}`;
  }

  static getMimeType(format: "csv" | "json" | "summary"): string {
    switch (format) {
      case "csv":
        return "text/csv";
      case "json":
        return "application/json";
      case "summary":
        return "text/plain";
      default:
        return "text/plain";
    }
  }
}
