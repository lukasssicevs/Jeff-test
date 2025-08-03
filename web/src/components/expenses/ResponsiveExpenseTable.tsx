"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { IoTrash } from "react-icons/io5";
import Image from "next/image";
import { Expense, ExpenseCategoryType } from "shared";

interface ResponsiveExpenseTableProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
  formatDate: (date: string) => string;
  formatCategory: (category: string) => string;
  formatCurrency: (amount: number) => string;
  getCategoryEmoji: (category: ExpenseCategoryType) => string;
}

export default function ResponsiveExpenseTable({
  expenses,
  onDeleteExpense,
  onImageClick,
  formatDate,
  formatCategory,
  formatCurrency,
  getCategoryEmoji,
}: ResponsiveExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20">
        <CardBody className="text-center px-6 py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">
            No expenses found
          </h3>
          <p className="text-slate-600 mb-6">
            Start by adding your first expense to track your spending.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table
          removeWrapper
          className="min-h-[400px]"
          aria-label="Expenses table"
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
            {expenses.map((expense) => (
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
                        onClick={() => onImageClick(expense.photo_url!)}
                        title="Click to view full image"
                      >
                        <Image
                          src={expense.photo_url}
                          alt="Receipt"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform shadow-sm block"
                          unoptimized
                          priority={false}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-slate-400"
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
                    isIconOnly
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                    onPress={() => onDeleteExpense(expense.id)}
                  >
                    <IoTrash className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {expenses.map((expense) => (
          <Card
            key={expense.id}
            className="shadow-lg bg-white/80 backdrop-blur-sm border border-white/20"
          >
            <CardBody className="p-4">
              {/* Header Row: Category and Delete Button */}
              <div className="flex items-center justify-between mb-3">
                <Chip
                  variant="flat"
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white"
                  size="sm"
                  startContent={
                    <span>{getCategoryEmoji(expense.category)}</span>
                  }
                >
                  {formatCategory(expense.category)}
                </Chip>
                <Button
                  isIconOnly
                  size="sm"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                  onPress={() => onDeleteExpense(expense.id)}
                >
                  <IoTrash className="w-4 h-4" />
                </Button>
              </div>

              {/* Amount - Most Important Info */}
              <div className="mb-3">
                <h3 className="font-bold text-slate-800 text-2xl">
                  {formatCurrency(expense.amount)}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {formatDate(expense.date)}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {expense.description}
              </p>

              {/* Image - Bottom Section */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Receipt:
                </span>
                {expense.photo_url ? (
                  <div
                    className="cursor-pointer"
                    onClick={() => onImageClick(expense.photo_url!)}
                    title="Click to view full image"
                  >
                    <Image
                      src={expense.photo_url}
                      alt="Receipt"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform shadow-sm"
                      unoptimized
                      priority={false}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-slate-400"
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
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
