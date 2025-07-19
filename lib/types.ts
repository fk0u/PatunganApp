export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // user ID
  createdAt: number;
  updatedAt: number;
  members: GroupMember[];
  imageURL?: string;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: number;
  status: 'active' | 'invited' | 'removed';
}

export interface Expense {
  id: string;
  groupId: string;
  eventId?: string; // optional, linked to an event
  title: string;
  amount: number;
  paidBy: string; // user ID
  createdAt: number;
  category?: string;
  receiptURL?: string;
  participants: ExpenseParticipant[];
  status: 'active' | 'settled' | 'cancelled';
}

export interface ExpenseParticipant {
  userId: string;
  share: number; // amount to be paid by this participant
  status: 'pending' | 'paid';
  paidAt?: number;
}

export interface Debt {
  id: string;
  fromUserId: string; // who owes
  toUserId: string; // who is owed
  amount: number;
  expenseId: string;
  groupId: string;
  eventId?: string;
  createdAt: number;
  status: 'pending' | 'paid' | 'cancelled';
  settledAt?: number;
}

export interface Event {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  startDate: number;
  endDate?: number;
  budget?: number;
  location?: string;
  createdBy: string; // user ID
  createdAt: number;
  updatedAt: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  participants: EventParticipant[];
}

export interface EventParticipant {
  userId: string;
  role: 'organizer' | 'participant';
  contribution?: number; // how much they've contributed to the budget
  joinedAt: number;
  status: 'invited' | 'confirmed' | 'declined';
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: 'direct-payment' | 'debt-settlement';
  relatedDebtIds?: string[]; // Which debts this transaction settles
  createdAt: number;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface DebtSimplification {
  id: string;
  originalDebtIds: string[]; // original debt relationships
  suggestedTransactions: Transaction[]; // simplified transactions
  createdAt: number;
  status: 'suggested' | 'applied' | 'ignored';
}

export interface PlaceRecommendation {
  id: string;
  name: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  averageExpense: number;
  popularity: number; // calculated based on number of visits
  tags: string[];
  rating?: number;
}
