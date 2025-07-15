"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ArrowLeft, CreditCard, Calendar, Users, AlertTriangle } from "lucide-react";

export default function NewSubscriptionPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [subscriptionData, setSubscriptionData] = useState({
    name: "",
    amount: "",
    cycle: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    primaryPayerId: "",
    description: ""
  });

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      fetchGroupDetails(params.id);
    }
  }, [user, params.id, router]);

  const fetchGroupDetails = async (groupId) => {
    setLoading(true);
    try {
      // TODO: Replace with actual Firebase fetch
      // This is placeholder data for UI development
      setTimeout(() => {
        const mockGroup = {
          id: groupId,
          name: groupId === "group1" ? "Anak Kostan" : "Tim Futsal",
          members: [
            { id: "user123", displayName: "Al-Ghani", avatarUrl: null, role: "owner" },
            { id: "user456", displayName: "Budi", avatarUrl: null, role: "member" },
            { id: "user789", displayName: "Cahya", avatarUrl: null, role: "member" },
          ]
        };
        setGroup(mockGroup);
        
        // Pre-select all members
        const allMemberIds = mockGroup.members.map(member => member.id);
        setSelectedMembers(allMemberIds);
        
        // Set current user as primary payer
        setSubscriptionData(prev => ({
          ...prev,
          primaryPayerId: mockGroup.members[0].id // For demo, select first member
        }));
        
        // Initialize custom splits with equal values
        const equalSplit = 100 / allMemberIds.length;
        const initialCustomSplits = {};
        allMemberIds.forEach(id => {
          initialCustomSplits[id] = equalSplit;
        });
        setCustomSplits(initialCustomSplits);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching group details:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSubscriptionData({
      ...subscriptionData,
      [name]: name === "amount" ? value.replace(/[^0-9]/g, "") : value
    });
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        // If primary payer is being removed, set a warning or prevent removal
        if (memberId === subscriptionData.primaryPayerId) {
          return prev;
        }
        const newSelected = prev.filter(id => id !== memberId);
        // Recalculate custom splits
        if (splitType === "custom" && newSelected.length > 0) {
          const total = newSelected.reduce((sum, id) => sum + (customSplits[id] || 0), 0);
          if (total < 100) {
            const newSplits = { ...customSplits };
            const diff = 100 - total;
            newSelected.forEach(id => {
              newSplits[id] = customSplits[id] + (diff / newSelected.length);
            });
            setCustomSplits(newSplits);
          }
        }
        return newSelected;
      } else {
        const newSelected = [...prev, memberId];
        // Add new member with equal split if custom
        if (splitType === "custom") {
          const equalSplit = 100 / newSelected.length;
          const newSplits = {};
          newSelected.forEach(id => {
            newSplits[id] = equalSplit;
          });
          setCustomSplits(newSplits);
        }
        return newSelected;
      }
    });
  };

  const handlePrimaryPayerChange = (memberId) => {
    // Ensure the primary payer is also selected as a participant
    if (!selectedMembers.includes(memberId)) {
      setSelectedMembers(prev => [...prev, memberId]);
    }
    
    setSubscriptionData(prev => ({
      ...prev,
      primaryPayerId: memberId
    }));
  };

  const handleCustomSplitChange = (memberId, value) => {
    const numValue = parseFloat(value) || 0;
    setCustomSplits(prev => {
      const newSplits = { ...prev, [memberId]: numValue };
      
      // Calculate total of current splits
      const selectedTotal = selectedMembers.reduce((total, id) => {
        return id === memberId ? total + numValue : total + (newSplits[id] || 0);
      }, 0);
      
      // If total exceeds 100%, adjust the last changed value
      if (selectedTotal > 100) {
        newSplits[memberId] = numValue - (selectedTotal - 100);
      }
      
      return newSplits;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subscriptionData.name || !subscriptionData.amount || selectedMembers.length === 0) {
      // Show error
      return;
    }
    
    try {
      // Prepare subscription data with participant splits
      const participants = {};
      
      if (splitType === "equal") {
        const equalSplit = 100 / selectedMembers.length;
        selectedMembers.forEach(id => {
          participants[id] = equalSplit;
        });
      } else {
        selectedMembers.forEach(id => {
          participants[id] = customSplits[id] || 0;
        });
      }
      
      // TODO: Implement subscription creation with Firebase
      console.log("Creating subscription:", {
        ...subscriptionData,
        amount: parseInt(subscriptionData.amount),
        groupId: params.id,
        participants
      });
      
      // For now, simulate success and redirect
      router.push(`/groups/${params.id}`);
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const handleCancel = () => {
    router.push(`/groups/${params.id}`);
  };

  if (!user) return null;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-purple-500 border-white/20 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Memuat data grup...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Grup tidak ditemukan</h2>
          <button 
            onClick={() => router.push("/groups")}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-3 rounded-full font-medium"
          >
            Kembali ke Daftar Grup
          </button>
        </div>
      </div>
    );
  }

  const totalSplitPercentage = selectedMembers.reduce((total, id) => total + (customSplits[id] || 0), 0);
  const splitPercentageValid = Math.abs(totalSplitPercentage - 100) < 0.01; // Allow small floating point errors

  return (
    <div className="min-h-screen bg-black text-white">
      <BackgroundBeams />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/groups/${params.id}`)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Kembali ke halaman grup"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Langganan Baru</h1>
              <p className="text-gray-400">Grup: {group.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto p-6 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Subscription Details Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Informasi Langganan</h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Subscription Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama Layanan</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="pl-3 text-gray-400">
                    <CreditCard size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={subscriptionData.name}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none px-3 py-3 text-white outline-none"
                    placeholder="Contoh: Netflix, Spotify, Youtube Premium"
                    required
                  />
                </div>
              </div>

              {/* Subscription Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Biaya Langganan</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="pl-3 text-gray-400 font-medium">
                    Rp
                  </div>
                  <input
                    type="text"
                    name="amount"
                    value={subscriptionData.amount === "" ? "" : parseInt(subscriptionData.amount).toLocaleString("id-ID")}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none px-3 py-3 text-white outline-none"
                    placeholder="Contoh: 169000"
                    required
                  />
                </div>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Siklus Pembayaran</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setSubscriptionData({...subscriptionData, cycle: "monthly"})}
                    className={`flex items-center justify-center p-3 rounded-lg cursor-pointer border ${
                      subscriptionData.cycle === "monthly" 
                        ? "bg-purple-500/20 border-purple-400/30" 
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span>Bulanan</span>
                  </div>
                  
                  <div
                    onClick={() => setSubscriptionData({...subscriptionData, cycle: "yearly"})}
                    className={`flex items-center justify-center p-3 rounded-lg cursor-pointer border ${
                      subscriptionData.cycle === "yearly" 
                        ? "bg-purple-500/20 border-purple-400/30" 
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span>Tahunan</span>
                  </div>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tanggal Mulai</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="pl-3 text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={subscriptionData.startDate}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none px-3 py-3 text-white outline-none"
                    title="Tanggal Mulai"
                    required
                  />
                </div>
              </div>

              {/* Primary Payer */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pembayar Utama</label>
                <p className="text-sm text-gray-400 mb-3">Anggota yang membayar langganan ini terlebih dahulu</p>
                
                <div className="space-y-2">
                  {group.members.map(member => (
                    <div 
                      key={`payer-${member.id}`} 
                      onClick={() => handlePrimaryPayerChange(member.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                        subscriptionData.primaryPayerId === member.id ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.displayName}</span>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full ${
                        subscriptionData.primaryPayerId === member.id ? 'bg-purple-500 border-purple-400' : 'border border-white/30'
                      } flex items-center justify-center`}>
                        {subscriptionData.primaryPayerId === member.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi (Opsional)</label>
                <textarea
                  name="description"
                  value={subscriptionData.description}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none"
                  placeholder="Tambahkan detail tentang langganan ini"
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Participants Selection */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pilih Peserta</h2>
              <p className="text-sm text-gray-400">
                {selectedMembers.length} dari {group.members.length} dipilih
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="space-y-2">
                {group.members.map(member => {
                  const isPrimaryPayer = subscriptionData.primaryPayerId === member.id;
                  
                  return (
                    <div 
                      key={`participant-${member.id}`} 
                      onClick={() => !isPrimaryPayer && toggleMemberSelection(member.id)}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isPrimaryPayer ? 'bg-purple-500/10 border border-purple-400/20 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        selectedMembers.includes(member.id) && !isPrimaryPayer ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">{member.displayName}</span>
                          {isPrimaryPayer && (
                            <span className="text-xs text-purple-300 ml-2">(Pembayar Utama)</span>
                          )}
                        </div>
                      </div>
                      
                      {!isPrimaryPayer && (
                        <div className={`w-6 h-6 rounded-full border ${
                          selectedMembers.includes(member.id) ? 'bg-purple-500 border-purple-400' : 'bg-transparent border-white/30'
                        } flex items-center justify-center`}>
                          {selectedMembers.includes(member.id) && (
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 5L4.33333 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Split Type Selection */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Metode Pembagian</h2>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  onClick={() => setSplitType("equal")}
                  className={`flex items-center justify-center p-3 rounded-lg cursor-pointer border ${
                    splitType === "equal" ? "bg-purple-500/20 border-purple-400/30" : "bg-white/5 border-white/10"
                  }`}
                >
                  <span>Sama Rata</span>
                </div>
                
                <div
                  onClick={() => setSplitType("custom")}
                  className={`flex items-center justify-center p-3 rounded-lg cursor-pointer border ${
                    splitType === "custom" ? "bg-purple-500/20 border-purple-400/30" : "bg-white/5 border-white/10"
                  }`}
                >
                  <span>Kustom</span>
                </div>
              </div>
              
              {splitType === "equal" ? (
                <div className="text-center text-gray-400">
                  <p>Setiap anggota akan membayar bagian yang sama</p>
                  {selectedMembers.length > 0 && (
                    <p className="mt-2 font-semibold text-white">
                      {(100 / selectedMembers.length).toFixed(1)}% per orang
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!splitPercentageValid && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm mb-4">
                      <AlertTriangle size={16} />
                      <span>Total pembagian harus 100%. Saat ini: {totalSplitPercentage.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {selectedMembers.map(memberId => {
                    const member = group.members.find(m => m.id === memberId);
                    if (!member) return null;
                    
                    return (
                      <div key={`split-${memberId}`} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span>{member.displayName}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={customSplits[memberId] || 0}
                            onChange={(e) => handleCustomSplitChange(memberId, e.target.value)}
                            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-right"
                            min="0"
                            max="100"
                            step="1"
                          />
                          <span className="ml-1 text-gray-400">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-6 px-6">
            <div className="max-w-3xl mx-auto flex space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-lg border border-white/20 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Batal
              </button>
              
              <button
                type="submit"
                disabled={!splitPercentageValid && splitType === "custom"}
                className={`flex-1 py-3 px-4 rounded-lg text-white font-medium ${
                  !splitPercentageValid && splitType === "custom"
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                } transition-colors`}
              >
                Buat Langganan
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
