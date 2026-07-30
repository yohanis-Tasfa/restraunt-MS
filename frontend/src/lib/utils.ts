import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ethiopian Birr formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount).replace('ETB', 'Br')
}

// Date formatting
export function formatDate(date: string | Date): string {
  return new Intl.DateFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Calculations
export function calculateTax(amount: number, rate: number): number {
  return amount * (rate / 100)
}

export function calculateTotal(
  subtotal: number,
  taxRate: number = 0,
  vatRate: number = 15,
  serviceChargeRate: number = 10,
  discount: number = 0
): {
  subtotal: number
  discount: number
  tax: number
  vat: number
  serviceCharge: number
  total: number
} {
  const discountAmount = discount
  const afterDiscount = subtotal - discountAmount
  const serviceCharge = afterDiscount * (serviceChargeRate / 100)
  const tax = afterDiscount * (taxRate / 100)
  const vat = afterDiscount * (vatRate / 100)
  const total = afterDiscount + serviceCharge + tax + vat

  return {
    subtotal,
    discount: discountAmount,
    tax,
    vat,
    serviceCharge,
    total,
  }
}
