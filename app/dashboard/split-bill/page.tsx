"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Share2,
  Loader2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';

// Define type for receipt data
type ReceiptItem = {
  name: string;
  price: number;
  quantity?: number;
};

type ReceiptData = {
  items: ReceiptItem[];
  total: number;
  merchant: string;
  date: string;
  groupId: string;
};

type SplitItem = ReceiptItem & {
  splitMode: 'equal' | 'percentage' | 'manual';
  participants: Record<string, { 
    included: boolean;
    value: number; // Percentage or manual amount
    share: number; // Calculated share
  }>;
  expanded: boolean;
};

export default function SplitBillPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { userGroups, currentGroup, fetchGroupDetails } = useGroup();
  
  const [isLoading, setIsLoading] = useState(true);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { saveReceiptSplit } = useGroup();
  
  // Initialize from session storage
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    
    const storedData = sessionStorage.getItem('receiptData');
    if (!storedData) {
      toast.error('Tidak ada data struk yang ditemukan');
      router.push('/scan');
      return;
    }
    
    try {
      const data = JSON.parse(storedData) as ReceiptData;
      setReceiptData(data);
      
      // Load group details
      const loadGroup = async () => {
        await fetchGroupDetails(data.groupId);
        const group = userGroups.find(g => g.id === data.groupId);
        if (group) {
          setSelectedGroup(group);
        }
      };
      loadGroup();
      
      // Initialize split items
      const initialSplitItems = data.items.map(item => ({
        ...item,
        splitMode: 'equal' as const,
        participants: {},
        expanded: false
      }));
      
      setSplitItems(initialSplitItems);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing receipt data:', error);
      toast.error('Data struk tidak valid');
      router.push('/scan');
    }
  }, [user, router, userGroups, fetchGroupDetails]);
  
  // Update participants when group changes
  useEffect(() => {
    if (!selectedGroup || !selectedGroup.members) return;
    
    setSplitItems(prev => prev.map(item => {
      const updatedParticipants: Record<string, { included: boolean, value: number, share: number }> = {};
      
      // Initialize all members as participants
      selectedGroup.members.forEach((member: any) => {
        if (member.status === 'active') {
          // Keep existing settings if they exist
          if (item.participants[member.id]) {
            updatedParticipants[member.id] = item.participants[member.id];
          } else {
            updatedParticipants[member.id] = {
              included: true,
              value: 0, // Will be calculated
              share: 0 // Will be calculated
            };
          }
        }
      });
      
      return {
        ...item,
        participants: updatedParticipants
      };
    }));
  }, [selectedGroup]);
  
  // Calculate shares when items or participants change
  useEffect(() => {
    if (!splitItems.length) return;
    
    const updatedItems = splitItems.map(item => {
      const activeParticipants = Object.entries(item.participants).filter(
        ([_, p]) => p.included
      );
      
      if (activeParticipants.length === 0) return item;
      
      const updatedParticipants = { ...item.participants };
      
      if (item.splitMode === 'equal') {
        // Equal split
        const perPersonAmount = item.price / activeParticipants.length;
        
        Object.keys(updatedParticipants).forEach(participantId => {
          updatedParticipants[participantId] = {
            ...updatedParticipants[participantId],
            value: Math.round(100 / activeParticipants.length), // Store as percentage
            share: updatedParticipants[participantId].included ? perPersonAmount : 0
          };
        });
      } 
      else if (item.splitMode === 'percentage') {
        // Percentage split - use the values already set
        let totalPercentage = 0;
        
        activeParticipants.forEach(([id]) => {
          totalPercentage += updatedParticipants[id].value;
        });
        
        // Normalize if total is not 100%
        if (totalPercentage !== 100 && totalPercentage !== 0) {
          const normalizeFactor = 100 / totalPercentage;
          
          activeParticipants.forEach(([id]) => {
            updatedParticipants[id].value = Math.round(updatedParticipants[id].value * normalizeFactor);
          });
        }
        
        // Calculate shares based on percentages
        Object.keys(updatedParticipants).forEach(id => {
          if (updatedParticipants[id].included) {
            updatedParticipants[id].share = (updatedParticipants[id].value / 100) * item.price;
          } else {
            updatedParticipants[id].share = 0;
          }
        });
      }
      else if (item.splitMode === 'manual') {
        // Manual split - use the values as is
        // Just ensure the total matches the item price
        const totalManual = activeParticipants.reduce(
          (sum, [id]) => sum + updatedParticipants[id].value, 0
        );
        
        if (totalManual !== item.price && activeParticipants.length > 0) {
          // Adjust the last participant to make it balance
          const lastId = activeParticipants[activeParticipants.length - 1][0];
          const adjustment = item.price - (totalManual - updatedParticipants[lastId].value);
          
          if (adjustment >= 0) {
            updatedParticipants[lastId].value = adjustment;
          }
        }
        
        // Set share equal to value for manual mode
        Object.keys(updatedParticipants).forEach(id => {
          updatedParticipants[id].share = updatedParticipants[id].included 
            ? updatedParticipants[id].value 
            : 0;
        });
      }
      
      return {
        ...item,
        participants: updatedParticipants
      };
    });
    
    setSplitItems(updatedItems);
  }, [splitItems.map(item => 
    `${item.name}-${item.price}-${item.splitMode}-${Object.values(item.participants)
      .map(p => `${p.included}-${p.value}`).join(',')}`
  ).join('|')]);
  
  const toggleParticipant = (itemIndex: number, participantId: string) => {
    setSplitItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[itemIndex] };
      const participants = { ...item.participants };
      
      participants[participantId] = {
        ...participants[participantId],
        included: !participants[participantId].included
      };
      
      newItems[itemIndex] = { ...item, participants };
      return newItems;
    });
  };
  
  const toggleSplitMode = (itemIndex: number) => {
    setSplitItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[itemIndex] };
      
      // Cycle through split modes
      const modes: ('equal' | 'percentage' | 'manual')[] = ['equal', 'percentage', 'manual'];
      const currentIndex = modes.indexOf(item.splitMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      
      newItems[itemIndex] = { 
        ...item, 
        splitMode: nextMode,
        // Reset values when changing modes
        participants: Object.fromEntries(
          Object.entries(item.participants).map(([id, p]) => [
            id, 
            { ...p, value: nextMode === 'manual' ? 0 : p.value, share: 0 }
          ])
        )
      };
      
      return newItems;
    });
  };
  
  const handleParticipantValueChange = (itemIndex: number, participantId: string, value: number) => {
    setSplitItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[itemIndex] };
      const participants = { ...item.participants };
      
      participants[participantId] = {
        ...participants[participantId],
        value: value
      };
      
      newItems[itemIndex] = { ...item, participants };
      return newItems;
    });
  };
  
  const toggleExpand = (itemIndex: number) => {
    setSplitItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex] = { 
        ...newItems[itemIndex], 
        expanded: !newItems[itemIndex].expanded 
      };
      return newItems;
    });
  };
  
  const getParticipantTotal = (participantId: string) => {
    return splitItems.reduce((total, item) => {
      if (item.participants[participantId]?.included) {
        return total + item.participants[participantId].share;
      }
      return total;
    }, 0);
  };
  
  const saveSplitBill = async () => {
    if (!receiptData || !selectedGroup) {
      toast.error('Data tidak lengkap');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Calculate final balances
      const balances: Record<string, Record<string, number>> = {};
      
      // Initialize balances for all participants
      selectedGroup.members.forEach((member: any) => {
        if (member.status === 'active') {
          balances[member.id] = {};
        }
      });
      
      // Calculate what each person paid and what they owe
      const memberTotals: Record<string, { paid: number, owes: number }> = {};
      
      selectedGroup.members.forEach((member: any) => {
        if (member.status === 'active') {
          memberTotals[member.id] = { paid: 0, owes: getParticipantTotal(member.id) };
        }
      });
      
      // For this example, assume the logged-in user paid for everything
      if (user) {
        memberTotals[user.uid].paid = receiptData.total;
      }
      
      // Calculate balances
      Object.entries(memberTotals).forEach(([fromId, fromData]) => {
        Object.entries(memberTotals).forEach(([toId, toData]) => {
          if (fromId !== toId) {
            if (fromData.paid > fromData.owes && toData.paid < toData.owes) {
              // This person paid more than they owe and the other person paid less
              const potentialTransfer = Math.min(
                fromData.paid - fromData.owes,
                toData.owes - toData.paid
              );
              
              if (potentialTransfer > 0) {
                balances[toId][fromId] = potentialTransfer;
                
                // Update the remaining amounts
                memberTotals[fromId].paid -= potentialTransfer;
                memberTotals[toId].owes -= potentialTransfer;
              }
            }
          }
        });
      });
      
      // Format balances for the API
      const balanceArray = Object.entries(balances).flatMap(([fromId, toBalances]) => 
        Object.entries(toBalances).map(([toId, amount]) => ({
          fromId,
          toId,
          amount
        }))
      );
      
      // Create a session in the group
      const sessionData = {
        name: `${receiptData.merchant} - ${receiptData.date}`,
        date: new Date().getTime(),
        items: splitItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          splitMode: item.splitMode,
          shares: Object.fromEntries(
            Object.entries(item.participants)
              .filter(([_, p]) => p.included)
              .map(([id, p]) => [id, p.share])
          )
        })),
        totalAmount: receiptData.total,
        paidBy: user?.uid,
        balances: balanceArray,
        participants: Object.keys(memberTotals).filter(id => memberTotals[id].owes > 0),
        receiptImage: receiptData.receiptImage || ""
      };
      
      // Use our GroupContext to save the receipt split
      const sessionId = await saveReceiptSplit(receiptData.groupId, sessionData);
      
      if (sessionId) {
        toast.success('Pembagian tagihan berhasil disimpan!');
        // Clear session storage
        sessionStorage.removeItem('receiptData');
        // Navigate back to dashboard
        router.push('/dashboard');
      } else {
        throw new Error('Failed to save receipt split');
      }
    } catch (error) {
      console.error('Error saving split bill:', error);
      toast.error('Gagal menyimpan pembagian tagihan');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }
  
  if (!receiptData || !selectedGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center text-center">
          <p className="mb-4">Data tidak ditemukan</p>
          <Button onClick={() => router.push('/scan')}>
            Kembali ke Scan
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/scan')}
            className="rounded-full bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Bagi Tagihan</h1>
          <div className="w-10" />
        </div>
        
        {/* Receipt Info */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">{receiptData.merchant}</h2>
              <p className="text-sm text-gray-400">{receiptData.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total</p>
              <p className="font-bold text-lg">
                {receiptData.total.toLocaleString('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR',
                  minimumFractionDigits: 0
                })}
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-400 mr-2">Grup:</span>
            <span>{selectedGroup.name}</span>
          </div>
        </div>
        
        {/* Item List */}
        <div className="space-y-3 mb-6">
          {splitItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-gray-900 rounded-xl overflow-hidden"
            >
              {/* Item Header */}
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="flex items-center text-sm mt-1">
                    <div className="bg-gray-800 rounded-full px-2 py-0.5 text-xs mr-2">
                      {item.splitMode === 'equal' && 'Dibagi Sama Rata'}
                      {item.splitMode === 'percentage' && 'Dibagi Persentase'}
                      {item.splitMode === 'manual' && 'Dibagi Manual'}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSplitMode(index);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
                
                <div className="text-right flex items-center">
                  <div className="mr-3">
                    <p className="text-gray-400 text-xs">Harga</p>
                    <p className="font-medium">
                      {item.price.toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      })}
                    </p>
                  </div>
                  {item.expanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Expanded Content */}
              {item.expanded && (
                <div className="p-4 pt-0 border-t border-gray-800">
                  <p className="mb-2 text-sm text-gray-400">Peserta</p>
                  
                  {selectedGroup.members
                    .filter((member: any) => member.status === 'active')
                    .map((member: any) => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`item-${index}-member-${member.id}`}
                            checked={item.participants[member.id]?.included || false}
                            onChange={() => toggleParticipant(index, member.id)}
                            className="mr-3 h-4 w-4"
                          />
                          <label 
                            htmlFor={`item-${index}-member-${member.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {member.displayName}
                          </label>
                        </div>
                        
                        {item.participants[member.id]?.included && (
                          <div className="flex items-center">
                            {item.splitMode === 'percentage' && (
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  value={item.participants[member.id].value.toString()}
                                  onChange={(e) => handleParticipantValueChange(
                                    index, 
                                    member.id, 
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="w-16 h-8 text-sm bg-gray-800 border-gray-700"
                                  min="0"
                                  max="100"
                                />
                                <span className="ml-1">%</span>
                              </div>
                            )}
                            
                            {item.splitMode === 'manual' && (
                              <div className="flex items-center">
                                <span className="mr-1">Rp</span>
                                <Input
                                  type="number"
                                  value={item.participants[member.id].value.toString()}
                                  onChange={(e) => handleParticipantValueChange(
                                    index, 
                                    member.id, 
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="w-24 h-8 text-sm bg-gray-800 border-gray-700"
                                  min="0"
                                />
                              </div>
                            )}
                            
                            {(item.splitMode === 'equal' || item.participants[member.id].share > 0) && (
                              <div className="text-right text-sm ml-3">
                                {item.participants[member.id].share.toLocaleString('id-ID', { 
                                  style: 'currency', 
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <h2 className="font-bold mb-3">Ringkasan Pembagian</h2>
          
          {selectedGroup.members
            .filter((member: any) => member.status === 'active')
            .map((member: any) => {
              const total = getParticipantTotal(member.id);
              if (total <= 0) return null;
              
              return (
                <div 
                  key={member.id}
                  className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-gray-700 mr-2"></div>
                    <span>{member.displayName}</span>
                  </div>
                  
                  <div className="font-medium">
                    {total.toLocaleString('id-ID', { 
                      style: 'currency', 
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    })}
                  </div>
                </div>
              );
            })
          }
        </div>
        
        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1 border-white/20"
            onClick={() => router.push('/scan')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Scan Baru
          </Button>
          
          <Button
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
            onClick={saveSplitBill}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pembagian
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
