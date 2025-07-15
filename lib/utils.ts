import { DebtCalculation, Participant, Transaction } from "@/types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to a relative time string (e.g. "5 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "baru saja";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit yang lalu`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam yang lalu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} hari yang lalu`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} bulan yang lalu`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} tahun yang lalu`;
}

/**
 * Calculates who owes whom based on transactions
 */
export function calculateDebts(
  transactions: Transaction[],
  participants: Participant[]
): DebtCalculation[] {
  // Step 1: Calculate how much each person has paid and how much they owe
  const balances: Record<string, number> = {};
  
  // Initialize balances for all participants to 0
  participants.forEach((participant) => {
    balances[participant.id] = 0;
  });
  
  // Calculate the raw balances based on transactions
  transactions.forEach((transaction) => {
    // Person who paid gets credit
    balances[transaction.paidBy] += transaction.amount;
    
    // If there are receipt items with specific participants
    if (transaction.receiptItems && transaction.receiptItems.length > 0) {
      // For each item, split among specific participants
      transaction.receiptItems.forEach((item) => {
        const amountPerPerson = (item.price * item.quantity) / item.participants.length;
        
        item.participants.forEach((participantId) => {
          balances[participantId] -= amountPerPerson;
        });
      });
    } else {
      // Simple split equally among all participants
      const amountPerPerson = transaction.amount / participants.length;
      
      participants.forEach((participant) => {
        balances[participant.id] -= amountPerPerson;
      });
    }
  });
  
  // Step 2: Create simplified debt calculations
  const debts: DebtCalculation[] = [];
  
  // Separate creditors (positive balance) from debtors (negative balance)
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by balance in descending order
  
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < 0)
    .sort((a, b) => a[1] - b[1]); // Sort by balance in ascending order (most negative first)
  
  // Match debtors with creditors to minimize the number of transactions
  let debtorIndex = 0;
  let creditorIndex = 0;
  
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const [debtorId, debtorBalance] = debtors[debtorIndex];
    const [creditorId, creditorBalance] = creditors[creditorIndex];
    
    // Skip if the same person
    if (debtorId === creditorId) {
      debtorIndex++;
      continue;
    }
    
    // Get participant names
    const debtorName = participants.find((p) => p.id === debtorId)?.name || "Unknown";
    const creditorName = participants.find((p) => p.id === creditorId)?.name || "Unknown";
    
    const absDebtorBalance = Math.abs(debtorBalance);
    const absCreditorBalance = Math.abs(creditorBalance);
    
    // Determine how much the debtor pays to the creditor
    const amount = Math.min(absDebtorBalance, absCreditorBalance);
    
    if (amount > 0) {
      // Create a debt calculation entry
      debts.push({
        from: debtorId,
        to: creditorId,
        fromName: debtorName,
        toName: creditorName,
        amount: Math.round(amount), // Round to avoid floating point errors
        status: "pending"
      });
      
      // Update balances
      debtors[debtorIndex] = [debtorId, debtorBalance + amount];
      creditors[creditorIndex] = [creditorId, creditorBalance - amount];
    }
    
    // Move to the next debtor/creditor if their balance is (close to) zero
    if (Math.abs(debtors[debtorIndex][1]) < 0.01) {
      debtorIndex++;
    }
    
    if (Math.abs(creditors[creditorIndex][1]) < 0.01) {
      creditorIndex++;
    }
  }
  
  return debts;
}

/**
 * Generates a random invite code
 */
export function generateInviteCode(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting similar looking characters
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Formats a number as currency (IDR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
