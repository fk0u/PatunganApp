"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AnonymousAuthButton() {
  const { loginAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAnonymousLogin = async () => {
    try {
      setLoading(true);
      await loginAnonymously();
      toast({
        title: "Login berhasil",
        description: "Anda telah masuk sebagai pengguna anonim",
      });
    } catch (error) {
      console.error("Error during anonymous login:", error);
      toast({
        title: "Login gagal",
        description: "Terjadi kesalahan saat login sebagai pengguna anonim",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleAnonymousLogin}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sedang Login...
        </>
      ) : (
        "Login Tanpa Akun"
      )}
    </Button>
  );
}
