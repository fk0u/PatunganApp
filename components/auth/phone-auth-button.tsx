"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PhoneAuthButton() {
  const { startPhoneLogin, confirmPhoneLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "verification">("phone");
  const { toast } = useToast();

  const handleSendCode = async () => {
    try {
      setLoading(true);
      // Ensure phone number is in E.164 format (e.g., +628123456789)
      const formattedNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;
      
      const verificationId = await startPhoneLogin(formattedNumber);
      setVerificationId(verificationId);
      setStep("verification");
      toast({
        title: "Kode verifikasi telah dikirim",
        description: "Silakan masukkan kode verifikasi yang dikirim ke nomor telepon Anda",
      });
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Gagal mengirim kode verifikasi",
        description: "Pastikan nomor telepon yang dimasukkan benar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      await confirmPhoneLogin(verificationId, verificationCode);
      setIsDialogOpen(false);
      toast({
        title: "Login berhasil",
        description: "Anda telah berhasil masuk dengan nomor telepon",
      });
    } catch (error) {
      console.error("Error during phone verification:", error);
      toast({
        title: "Verifikasi gagal",
        description: "Kode verifikasi tidak valid atau telah kedaluwarsa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            onClick={() => {
              setStep("phone");
              setPhoneNumber("");
              setVerificationCode("");
              setVerificationId("");
              setIsDialogOpen(true);
            }}
            className="w-full"
          >
            Login dengan Nomor HP
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === "phone" ? "Masukkan Nomor HP" : "Verifikasi Nomor HP"}
            </DialogTitle>
            <DialogDescription>
              {step === "phone"
                ? "Masukkan nomor HP Anda untuk menerima kode verifikasi"
                : "Masukkan kode verifikasi yang dikirim ke nomor HP Anda"}
            </DialogDescription>
          </DialogHeader>

          {step === "phone" ? (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="+628123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <div id="recaptcha-container"></div>
              <Button
                onClick={handleSendCode}
                disabled={loading || !phoneNumber}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim Kode...
                  </>
                ) : (
                  "Kirim Kode Verifikasi"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Kode Verifikasi"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <Button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length < 4}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Verifikasi & Login"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("phone")}
                className="w-full"
              >
                Kembali
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
