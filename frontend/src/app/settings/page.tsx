"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2, CheckCircle, UserCircle, Cpu, Shield, Key } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  
  // User Profile State
  const { user, updateName } = useAuthStore();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    fetchProviders();
    if (user) {
      setUserEmail(user.email);
      setUserName(user.email.split('@')[0]);
    }
  }, [user]);

  const fetchProviders = async () => {
    try {
      const res = await api.get("/ai-providers");
      setProviders(res.data);
    } catch (error) {
      toast.error("Failed to load AI providers");
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/ai-providers", { name, baseUrl, apiKey, modelName, isDefault: providers.length === 0 });
      toast.success("AI Provider added");
      setName("");
      setBaseUrl("");
      setApiKey("");
      setModelName("");
      fetchProviders();
    } catch (error) {
      toast.error("Failed to add AI Provider");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ai-providers/${id}`);
      toast.success("Provider removed");
      fetchProviders();
    } catch {
      toast.error("Failed to delete provider");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/ai-providers/${id}/default`);
      toast.success("Default provider set");
      fetchProviders();
    } catch {
      toast.error("Failed to update default provider");
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateName(userName);
    toast.success("Profile updated successfully");
    setUserPassword("");
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="hover:bg-white/5 rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your profile and configure AI Providers.</p>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        
        {/* User Profile Section */}
        <Card className="glassmorphism border-white/5 overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-fuchsia-400" />
              <CardTitle>User Profile</CardTitle>
            </div>
            <CardDescription>Update your personal information and password.</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    placeholder="Your Name" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="your@email.com" 
                    value={userEmail} 
                    onChange={(e) => setUserEmail(e.target.value)} 
                    className="bg-background/50 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Leave blank to keep current password" 
                    value={userPassword} 
                    onChange={(e) => setUserPassword(e.target.value)} 
                    className="bg-background/50 border-white/10 pl-9"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 bg-black/20 pt-4">
              <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white ml-auto">
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* AI Providers Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold">AI Providers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Add Provider Form */}
            <Card className="md:col-span-2 glassmorphism border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Add New</CardTitle>
                <CardDescription>Connect an OpenAI-compatible endpoint.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAddProvider}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">Provider Name</Label>
                    <Input placeholder="e.g. LM Studio Local" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">Base URL</Label>
                    <Input placeholder="http://localhost:1234/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required className="bg-background/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">API Key (Optional)</Label>
                    <Input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-background/50 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-semibold">Model Name</Label>
                    <Input placeholder="e.g. gpt-4" value={modelName} onChange={(e) => setModelName(e.target.value)} required className="bg-background/50 border-white/10" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-cyan/20">Add Provider</Button>
                </CardFooter>
              </form>
            </Card>

            {/* Provider List */}
            <div className="md:col-span-3 space-y-4">
              {providers.length === 0 ? (
                <div className="glassmorphism border border-white/5 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3 h-full min-h-[200px]">
                  <Shield className="w-8 h-8 opacity-50" />
                  <p>No providers configured.<br/>Add your first local or cloud AI provider to start analyzing code.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {providers.map((p: any) => (
                    <Card key={p.id} className={`glassmorphism border ${p.isDefault ? "border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "border-white/5"}`}>
                      <CardHeader className="py-4 px-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {p.name} 
                              {p.isDefault && <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Default</span>}
                            </CardTitle>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <p><span className="font-medium text-foreground/70">URL:</span> {p.baseUrl}</p>
                              <p><span className="font-medium text-foreground/70">Model:</span> <span className="text-fuchsia-400 font-mono text-xs">{p.modelName}</span></p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!p.isDefault && (
                              <Button variant="outline" size="sm" onClick={() => handleSetDefault(p.id)} className="h-8 border-white/10 hover:bg-white/5">Make Default</Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 self-end" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
