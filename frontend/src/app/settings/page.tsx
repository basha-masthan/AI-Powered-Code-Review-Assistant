"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [providers, setProviders] = useState([]);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchProviders();
  }, []);

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

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your AI Providers (OpenAI, LM Studio, Ollama, etc.)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add AI Provider</CardTitle>
            <CardDescription>Connect any OpenAI-compatible endpoint.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddProvider}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider Name</Label>
                <Input placeholder="e.g. LM Studio Local" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input placeholder="http://localhost:1234/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>API Key (Optional for Local)</Label>
                <Input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input placeholder="e.g. gpt-4" value={modelName} onChange={(e) => setModelName(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Save Provider</Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configured Providers</h3>
          {providers.length === 0 ? (
            <div className="text-muted-foreground text-sm border p-4 rounded-md text-center">No providers configured yet.</div>
          ) : (
            providers.map((p: any) => (
              <Card key={p.id} className={p.isDefault ? "border-primary" : ""}>
                <CardHeader className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-md flex items-center gap-2">
                        {p.name} {p.isDefault && <CheckCircle className="w-4 h-4 text-primary" />}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">{p.baseUrl}</CardDescription>
                      <CardDescription className="text-xs">Model: {p.modelName}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!p.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => handleSetDefault(p.id)}>Set Default</Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
