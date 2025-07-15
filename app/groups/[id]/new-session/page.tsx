"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ArrowLeft, Users, Calendar, Receipt, Upload, Camera, CreditCard } from "lucide-react";

export default function NewGroupSessionPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [sessionData, setSessionData] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
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
        setSelectedMembers(mockGroup.members.map(member => member.id));
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching group details:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSessionData({
      ...sessionData,
      [name]: value
    });
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sessionData.name || selectedMembers.length === 0) {
      // Show error
      return;
    }
    
    try {
      // TODO: Implement session creation with Firebase
      console.log("Creating session:", {
        ...sessionData,
        groupId: params.id,
        participants: selectedMembers
      });
      
      // For now, simulate success and redirect
      router.push(`/groups/${params.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
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
              <h1 className="text-2xl font-bold">Sesi Patungan Baru</h1>
              <p className="text-gray-400">Grup: {group.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto p-6 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Session Details Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Informasi Sesi</h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Session Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama Sesi</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="pl-3 text-gray-400">
                    <Receipt size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={sessionData.name}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none px-3 py-3 text-white outline-none"
                    placeholder="Contoh: Makan di Warteg Bahari"
                    required
                  />
                </div>
              </div>

              {/* Session Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tanggal</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="pl-3 text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={sessionData.date}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none px-3 py-3 text-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Session Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi (Opsional)</label>
                <textarea
                  name="description"
                  value={sessionData.description}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none"
                  placeholder="Tambahkan detail tentang sesi ini"
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
                {group.members.map(member => (
                  <div 
                    key={member.id} 
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      selectedMembers.includes(member.id) ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{member.displayName}</span>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full border ${
                      selectedMembers.includes(member.id) ? 'bg-purple-500 border-purple-400' : 'bg-transparent border-white/30'
                    } flex items-center justify-center`}>
                      {selectedMembers.includes(member.id) && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.33333 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Input Options Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Metode Input</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto">
                    <Receipt className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Input Manual</h3>
                    <p className="text-gray-400 text-sm">Input transaksi secara manual satu per satu</p>
                  </div>
                </div>
              </div>

              <div className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Scan Struk</h3>
                    <p className="text-gray-400 text-sm">Upload atau scan struk untuk input otomatis</p>
                  </div>
                </div>
              </div>
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
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-colors"
              >
                Buat Sesi
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
