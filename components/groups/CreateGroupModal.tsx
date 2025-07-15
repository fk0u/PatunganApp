"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Mail, Plus } from "lucide-react";

export function CreateGroupModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invites, setInvites] = useState([{ email: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddInvite = () => {
    setInvites([...invites, { email: "" }]);
  };
  
  const handleInviteChange = (index, value) => {
    const newInvites = [...invites];
    newInvites[index].email = value;
    setInvites(newInvites);
  };
  
  const handleRemoveInvite = (index) => {
    if (invites.length > 1) {
      const newInvites = [...invites];
      newInvites.splice(index, 1);
      setInvites(newInvites);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    // Filter out empty emails
    const validInvites = invites
      .filter(invite => invite.email.trim() !== "")
      .map(invite => invite.email.trim());
    
    try {
      await onCreate({
        name,
        description,
        invites: validInvites,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setInvites([{ email: "" }]);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full shadow-xl"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Buat Grup Baru</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Group Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nama Grup</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    placeholder="Contoh: Anak Kostan"
                    required
                  />
                </div>
                
                {/* Group Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi Grup (Opsional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white h-20"
                    placeholder="Jelaskan singkat tentang grup ini"
                  />
                </div>
                
                {/* Invite Members Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Undang Anggota (Opsional)</label>
                  
                  <div className="space-y-3">
                    {invites.map((invite, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                          <div className="pl-3 text-gray-400">
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            value={invite.email}
                            onChange={(e) => handleInviteChange(index, e.target.value)}
                            className="flex-1 bg-transparent border-none px-3 py-2 text-white outline-none"
                            placeholder="Email anggota"
                          />
                        </div>
                        {invites.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInvite(index)}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10"
                            aria-label="Hapus"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    className="mt-3 flex items-center text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Plus size={16} className="mr-1" />
                    <span>Tambah anggota lain</span>
                  </button>
                </div>
                
                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className={`w-full py-3 rounded-lg font-medium ${
                      isSubmitting || !name.trim() 
                      ? 'bg-gray-600 text-gray-400' 
                      : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600'
                    } transition-colors`}
                  >
                    {isSubmitting ? "Membuat..." : "Buat Grup"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
