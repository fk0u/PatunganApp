"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import "./auth-page.css"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login, signup, loginWithGoogle } = useAuth()
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isLogin) {
        await login(email, password)
        toast.success("Login successful!")
      } else {
        if (!displayName) {
          toast.error("Please enter your name")
          setLoading(false)
          return
        }
        
        await signup(email, password, displayName)
        toast.success("Account created successfully!")
      }
      
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Authentication error:", error)
      toast.error(error.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success("Login with Google successful!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Google authentication error:", error)
      toast.error(error.message || "Google authentication failed")
    } finally {
      setGoogleLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <BackgroundBeams />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center items-center min-h-screen py-10 px-4 relative z-10"
      >
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_70%)]"></div>
          <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.15),transparent_70%)]"></div>            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mt-6 auth-icon-container"
              >
            <UserIcon className="h-8 w-8 text-white" />
          </motion.div>
          
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-white">
              {isLogin ? "Masuk ke Patungan" : "Daftar Patungan"}
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              {isLogin 
                ? "Selamat datang kembali!" 
                : "Bergabunglah dengan kami"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10">
              <TabsTrigger value="login" className="data-[state=active]:bg-white/20">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white/20">Sign Up</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="mb-4">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500/50"
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500/50"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500/50"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>                <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center auth-submit-btn"
              >
                <span className="relative z-10 flex items-center">
                  {loading ? "Processing..." : isLogin ? "Masuk" : "Daftar"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </span>
              </motion.button>
            </form>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Separator className="flex-1 bg-white/20" />
                <span className="text-xs text-gray-400">atau</span>
                <Separator className="flex-1 bg-white/20" />
              </div>
              
              <motion.button 
                type="button" 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 border text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-white/10 border-white/20"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {/* Google Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="mr-2">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{googleLoading ? "Processing..." : "Lanjutkan dengan Google"}</span>
              </motion.button>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-transparent bg-clip-text font-medium transition-colors auth-gradient-text"
          >
            {isLogin 
              ? "Belum punya akun? Daftar sekarang" 
              : "Sudah punya akun? Masuk di sini"}
          </button>
        </CardFooter>
      </Card>
    </motion.div>
    </div>
  )
}
