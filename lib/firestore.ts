import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  DocumentReference,
  DocumentData,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  User, 
  Group, 
  Expense, 
  Debt, 
  Event, 
  Transaction,
  DebtSimplification 
} from "./types";

// User Functions
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUser: User = {
        id: user.uid,
        ...userData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(userRef, newUser);
      return newUser;
    } else {
      return userDoc.data() as User;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Group Functions
export const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    const newGroup: Omit<Group, 'id'> = {
      ...groupData,
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const groupRef = await addDoc(collection(db, 'groups'), newGroup);
    return { id: groupRef.id, ...newGroup } as Group;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      return { id: groupDoc.id, ...groupDoc.data() } as Group;
    }
    return null;
  } catch (error) {
    console.error('Error getting group by ID:', error);
    throw error;
  }
};

export const getUserGroups = async (): Promise<Group[]> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', { userId: user.uid, status: 'active' })
    );

    const groupsSnapshot = await getDocs(groupsQuery);
    return groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

// Expense Functions
export const createExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'status'>): Promise<Expense> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    // Validate group exists
    const groupRef = doc(db, 'groups', expenseData.groupId);
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists()) throw new Error('Group not found');

    // Start a batch
    const batch = writeBatch(db);
    
    // Create the expense
    const newExpense: Omit<Expense, 'id'> = {
      ...expenseData,
      paidBy: user.uid,
      createdAt: Date.now(),
      status: 'active'
    };
    
    const expenseRef = doc(collection(db, 'expenses'));
    batch.set(expenseRef, newExpense);
    
    // Create debt records for each participant
    const paidById = newExpense.paidBy;
    
    for (const participant of newExpense.participants) {
      if (participant.userId !== paidById && participant.share > 0) {
        const debtRef = doc(collection(db, 'debts'));
        const debtData: Omit<Debt, 'id'> = {
          fromUserId: participant.userId,
          toUserId: paidById,
          amount: participant.share,
          expenseId: expenseRef.id,
          groupId: newExpense.groupId,
          eventId: newExpense.eventId,
          createdAt: Date.now(),
          status: 'pending'
        };
        batch.set(debtRef, debtData);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return { id: expenseRef.id, ...newExpense } as Expense;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
  try {
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const expensesSnapshot = await getDocs(expensesQuery);
    return expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  } catch (error) {
    console.error('Error getting group expenses:', error);
    throw error;
  }
};

// Debt Functions
export const getUserDebts = async (): Promise<Debt[]> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    // Get debts where user owes someone
    const owedDebtsQuery = query(
      collection(db, 'debts'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const owedDebtsSnapshot = await getDocs(owedDebtsQuery);
    const owedDebts = owedDebtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));

    // Get debts where someone owes the user
    const receivableDebtsQuery = query(
      collection(db, 'debts'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const receivableDebtsSnapshot = await getDocs(receivableDebtsQuery);
    const receivableDebts = receivableDebtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));

    return [...owedDebts, ...receivableDebts];
  } catch (error) {
    console.error('Error getting user debts:', error);
    throw error;
  }
};

export const settleDebt = async (debtId: string, transactionDetails?: Omit<Transaction, 'id' | 'createdAt' | 'status'>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    const debtRef = doc(db, 'debts', debtId);
    const debtDoc = await getDoc(debtRef);
    
    if (!debtDoc.exists()) throw new Error('Debt not found');
    
    const debt = debtDoc.data() as Debt;
    
    // Ensure the user is authorized to settle this debt
    if (debt.fromUserId !== user.uid && debt.toUserId !== user.uid) {
      throw new Error('Unauthorized to settle this debt');
    }
    
    const batch = writeBatch(db);
    
    // Update the debt status
    batch.update(debtRef, { 
      status: 'paid',
      settledAt: Date.now()
    });
    
    // Create a transaction record if details provided
    if (transactionDetails) {
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionData: Omit<Transaction, 'id'> = {
        ...transactionDetails,
        relatedDebtIds: [debtId],
        createdAt: Date.now(),
        status: 'completed'
      };
      batch.set(transactionRef, transactionData);
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error settling debt:', error);
    throw error;
  }
};

// Event Functions
export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'>): Promise<Event> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');
    
    // Ensure the group exists
    const groupRef = doc(db, 'groups', eventData.groupId);
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists()) throw new Error('Group not found');
    
    const newEvent: Omit<Event, 'id'> = {
      ...eventData,
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'planning'
    };
    
    const eventRef = await addDoc(collection(db, 'events'), newEvent);
    return { id: eventRef.id, ...newEvent } as Event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const getGroupEvents = async (groupId: string): Promise<Event[]> => {
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      where('groupId', '==', groupId),
      orderBy('startDate', 'desc')
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    return eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  } catch (error) {
    console.error('Error getting group events:', error);
    throw error;
  }
};

// Debt Simplification
export const generateDebtSimplification = async (groupId: string): Promise<DebtSimplification | null> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');
    
    // Get all pending debts in the group
    const debtsQuery = query(
      collection(db, 'debts'),
      where('groupId', '==', groupId),
      where('status', '==', 'pending')
    );
    
    const debtsSnapshot = await getDocs(debtsQuery);
    const debts = debtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
    
    if (debts.length === 0) return null;
    
    // Create a debt graph for simplification
    const debtGraph: Record<string, Record<string, number>> = {};
    
    // Initialize the graph
    for (const debt of debts) {
      if (!debtGraph[debt.fromUserId]) debtGraph[debt.fromUserId] = {};
      if (!debtGraph[debt.toUserId]) debtGraph[debt.toUserId] = {};
    }
    
    // Fill in the debt amounts
    for (const debt of debts) {
      if (!debtGraph[debt.fromUserId][debt.toUserId]) {
        debtGraph[debt.fromUserId][debt.toUserId] = 0;
      }
      debtGraph[debt.fromUserId][debt.toUserId] += debt.amount;
    }
    
    // Simplify the debts using a greedy algorithm
    const simplifiedTransactions: Omit<Transaction, 'id' | 'createdAt' | 'status'>[] = [];
    
    // Implementation of debt simplification algorithm would go here
    // This is a complex algorithm that would need to be implemented separately
    
    // For now, just return the original transactions as a placeholder
    for (const debt of debts) {
      simplifiedTransactions.push({
        fromUserId: debt.fromUserId,
        toUserId: debt.toUserId,
        amount: debt.amount,
        type: 'debt-settlement',
        relatedDebtIds: [debt.id],
        description: 'Simplified debt payment'
      });
    }
    
    // Save the simplified debt solution
    const debtSimplificationData: Omit<DebtSimplification, 'id'> = {
      originalDebtIds: debts.map(debt => debt.id),
      suggestedTransactions: simplifiedTransactions.map(transaction => ({
        ...transaction,
        id: '',
        createdAt: Date.now(),
        status: 'pending'
      })) as Transaction[],
      createdAt: Date.now(),
      status: 'suggested'
    };
    
    const simplificationRef = await addDoc(collection(db, 'debtSimplifications'), debtSimplificationData);
    
    return { 
      id: simplificationRef.id, 
      ...debtSimplificationData 
    } as DebtSimplification;
  } catch (error) {
    console.error('Error generating debt simplification:', error);
    throw error;
  }
};
