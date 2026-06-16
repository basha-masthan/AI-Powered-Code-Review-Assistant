"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, RefreshCw, Code2 } from "lucide-react";

export default function AIChat({ projectId }: { projectId: string }) {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProviders();
    fetchSessions();
  }, [projectId]);

  useEffect(() => {
    if (selectedSession) fetchMessages(selectedSession);
    else setMessages([]);
  }, [selectedSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchProviders = async () => {
    try {
      const res = await api.get("/ai-providers");
      setProviders(res.data);
      if (res.data.length > 0) {
        const def = res.data.find((p: any) => p.isDefault);
        setSelectedProvider(def ? def.id : res.data[0].id);
      }
    } catch {}
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/chat/sessions?projectId=${projectId}`);
      setSessions(res.data);
      if (res.data.length > 0 && !selectedSession) {
        setSelectedSession(res.data[0].id);
      }
    } catch {}
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(res.data);
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedProvider) return;
    
    const content = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "USER", content }]);
    setIsSending(true);

    try {
      const res = await api.post("/chat/message", {
        projectId,
        aiProviderId: selectedProvider,
        sessionId: selectedSession || undefined,
        content
      });
      
      setMessages((prev) => [...prev, res.data.message]);
      if (!selectedSession) {
        setSelectedSession(res.data.sessionId);
        fetchSessions();
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[600px] gap-6">
      {/* Session List */}
      <Card className="w-1/4 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Code2 className="w-5 h-5"/> Chat Sessions</h3>
          <Button variant="ghost" size="icon" onClick={() => setSelectedSession("")} title="New Chat"><Plus className="w-4 h-4"/></Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            <div 
              onClick={() => setSelectedSession("")}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${!selectedSession ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <div className="font-medium text-sm">New Session</div>
            </div>
            {sessions.map(session => (
              <div 
                key={session.id} 
                onClick={() => setSelectedSession(session.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors text-sm ${selectedSession === session.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <div>Session {new Date(session.createdAt).toLocaleDateString()}</div>
                <div className="text-xs opacity-70">{new Date(session.createdAt).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-muted/10">
          <div className="font-medium">{selectedSession ? 'Conversation' : 'New Chat (Ask about codebase)'}</div>
          <Select value={selectedProvider} onValueChange={(val) => setSelectedProvider(val || "")}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="AI Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
              <Bot className="w-12 h-12 opacity-20" />
              <p>Ask anything about your code!</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.role === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-xl max-w-[80%] text-sm ${msg.role === 'USER' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none whitespace-pre-wrap'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-xl bg-muted rounded-tl-none">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/10">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask a question about the project..." 
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// Quick component missing import added directly
import { Plus } from "lucide-react";
