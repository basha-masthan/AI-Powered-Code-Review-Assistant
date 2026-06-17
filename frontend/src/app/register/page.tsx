"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Code2, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/register", { email, password });
      setAuth(res.data.user, res.data.access_token);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a0a0a]">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 animate-fade-in relative z-10">
        <div className="w-full max-w-md space-y-8 relative">
          
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <Link href="/" className="flex items-center gap-2 justify-center lg:justify-start mb-6 w-fit hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-[1px]">
                <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                Strix AI
              </span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Sign up to start analyzing your codebases
            </p>
          </div>

          <div className="glassmorphism rounded-2xl p-8 shadow-glow-cyan/10">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                    className="bg-background/50 border-white/10 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters long.</p>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-glow-cyan/20" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Visuals */}
      <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
        
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px]" />

        <div className="relative z-10 w-full max-w-lg p-12 glassmorphism rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-fuchsia-400" />
            <h2 className="text-2xl font-bold text-white">Secure & Private</h2>
          </div>
          <div className="space-y-4 text-white/70 leading-relaxed">
            <p>
              Your code privacy is our priority. Connect to local LLMs like LM Studio or Ollama 
              to keep your source code entirely on your machine.
            </p>
            <ul className="space-y-3 mt-8">
              {[
                "End-to-end local processing available",
                "No code storage without permission",
                "Bring your own API keys",
                "Enterprise-grade security scanning"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                  <span className="text-sm font-medium text-white/90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
