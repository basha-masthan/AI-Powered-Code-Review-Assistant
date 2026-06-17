"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Play, FileCheck2, AlertCircle, AlertTriangle, Info, Search, FileText, Beaker, ArrowLeft, History } from "lucide-react";

export default function ReviewDashboard({ projectId }: { projectId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [reviewMode, setReviewMode] = useState<string>("SECURITY");
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchReviews();
    fetchProviders();
  }, [projectId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews?projectId=${projectId}`);
      setReviews(res.data);
    } catch {
      toast.error("Failed to fetch reviews");
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await api.get("/ai-providers");
      setProviders(res.data);
      if (res.data.length > 0) {
        const def = res.data.find((p: any) => p.isDefault);
        setSelectedProvider(def ? def.id : res.data[0].id);
      }
    } catch {
      //
    }
  };

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(r =>
      r.mode.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      (r.summary && r.summary.toLowerCase().includes(q))
    );
  }, [reviews, searchQuery]);

  const handleTriggerReview = async () => {
    if (!selectedProvider) return toast.error("Please select an AI Provider in Settings first");
    setIsTriggering(true);
    try {
      await api.post("/reviews/trigger", {
        projectId,
        mode: reviewMode,
        aiProviderId: selectedProvider,
      });
      toast.success("Review triggered! It will run in the background.");
      setTimeout(fetchReviews, 2000);
    } catch {
      toast.error("Failed to trigger review");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleViewReview = async (id: string) => {
    try {
      const res = await api.get(`/reviews/${id}`);
      setSelectedReview(res.data);
    } catch {
      toast.error("Failed to load review details");
    }
  };

  const handleGenerateDocs = async () => {
    if (!selectedProvider) return toast.error("Please select an AI Provider first");
    try {
      const res = await api.get(`/reviews/bonus/generate-docs?projectId=${projectId}&aiProviderId=${selectedProvider}`);
      const blob = new Blob([res.data.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'README.md';
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Documentation generated and downloaded!");
    } catch {
      toast.error("Failed to generate documentation");
    }
  };

  const handleGenerateTests = async () => {
    if (!selectedProvider) return toast.error("Please select an AI Provider first");
    try {
      const filesRes = await api.get(`/projects/${projectId}/files`);
      if (filesRes.data.length === 0) return toast.error("No files in project");
      const firstFile = filesRes.data[0];
      const res = await api.get(`/reviews/bonus/generate-test?fileId=${firstFile.id}&aiProviderId=${selectedProvider}`);
      const blob = new Blob([res.data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${firstFile.path.split('/').pop()}.test.js`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Tests generated and downloaded!");
    } catch {
      toast.error("Failed to generate tests");
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // On Mobile: Only show ONE panel at a time to prevent scroll squash
  // 1. If NO selectedReview: show Form AND History (stacked, scrollable)
  // 2. If selectedReview: show Details (with a Back button)

  // On Desktop (lg): Show 3 Columns: Form | Details | History

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[700px] w-full max-w-full lg:min-h-0">
      
      {/* LEFT COLUMN: Trigger New AI Review (Hidden on mobile if a review is selected) */}
      <div className={`w-full lg:w-[320px] xl:w-[350px] flex flex-col lg:min-h-0 lg:h-full ${selectedReview ? "hidden lg:flex" : ""}`}>
        <Card className="lg:h-full flex flex-col border-white/10 glassmorphism shadow-lg">
          <CardHeader className="pb-3 bg-white/[0.02] border-b border-white/5 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" /> New Analysis
            </CardTitle>
            <CardDescription>Trigger an AI review on the codebase.</CardDescription>
          </CardHeader>
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <CardContent className="space-y-4 pt-4">
              {/* Provider + Template on ONE row on mobile, stacked on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase text-xs tracking-wider font-semibold">AI Provider</Label>
                  <Select value={selectedProvider} onValueChange={(val) => setSelectedProvider(val || "")}>
                    <SelectTrigger className="bg-background/50 border-white/10 h-9 text-xs">
                      <SelectValue placeholder="Select provider">
                        {providers.find(p => p.id === selectedProvider)?.name || "Select AI"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase text-xs tracking-wider font-semibold">Template</Label>
                  <Select value={reviewMode} onValueChange={(val) => setReviewMode(val || "")}>
                    <SelectTrigger className="bg-background/50 border-white/10 h-9 text-xs">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SECURITY">Security</SelectItem>
                      <SelectItem value="PERFORMANCE">Performance</SelectItem>
                      <SelectItem value="CODE_QUALITY">Code Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-primary to-fuchsia-500 hover:from-primary/80 hover:to-fuchsia-500/80 text-white shadow-lg" onClick={handleTriggerReview} disabled={isTriggering}>
                {isTriggering ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Start Review
              </Button>
              
              <div className="border-t border-white/10 pt-4 space-y-3">
                <Label className="text-muted-foreground uppercase text-xs tracking-wider font-semibold">Bonus Tools</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-white/10 hover:bg-white/5" onClick={handleGenerateDocs}>
                    <FileText className="w-3.5 h-3.5 mr-1" /> Docs
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-white/10 hover:bg-white/5" onClick={handleGenerateTests}>
                    <Beaker className="w-3.5 h-3.5 mr-1" /> Tests
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* MIDDLE COLUMN: Details Pane (Hidden on mobile if NO review is selected) */}
      <div className={`flex-1 border border-white/10 rounded-xl overflow-hidden glassmorphism bg-background/40 flex flex-col min-h-0 h-full shadow-2xl relative ${selectedReview ? 'flex' : 'hidden lg:flex'}`}>
        {selectedReview ? (
          <>
            <div className="p-4 md:p-6 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden flex items-center gap-1.5 h-8 text-xs bg-white/5 hover:bg-white/10"
                    onClick={() => setSelectedReview(null)}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </Button>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
                      <FileCheck2 className="w-5 h-5 md:w-6 md:h-6 text-fuchsia-400" /> {selectedReview.mode} Analysis
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Status: <Badge variant={selectedReview.status === 'COMPLETED' ? 'default' : selectedReview.status === 'FAILED' ? 'destructive' : 'secondary'} className="ml-1 mr-2">{selectedReview.status}</Badge> | {new Date(selectedReview.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-black/20 border border-white/5 p-4 rounded-lg backdrop-blur-sm">
                <h3 className="font-semibold mb-2 text-cyan-400 text-sm uppercase tracking-wider">Executive Summary</h3>
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{selectedReview.summary || "No summary available. Analysis might still be pending."}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="p-4 md:p-6">
                {selectedReview.issues && selectedReview.issues.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" /> 
                      Detected Issues ({selectedReview.issues.length})
                    </h3>
                    {selectedReview.issues.map((issue: any) => (
                      <Card key={issue.id} className="border-l-4 glassmorphism bg-background/50 border-white/5 overflow-hidden group" style={{ borderLeftColor: issue.severity === 'CRITICAL' ? '#ef4444' : issue.severity === 'HIGH' ? '#f97316' : issue.severity === 'MEDIUM' ? '#eab308' : '#3b82f6' }}>
                        <CardHeader className="py-3 px-4 bg-white/[0.02] border-b border-white/5">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(issue.severity)}
                            <CardTitle className="text-md text-foreground">{issue.severity}</CardTitle>
                            {issue.lineNumber && <Badge variant="outline" className="ml-auto bg-black/40 border-white/10">Line {issue.lineNumber}</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 py-4 text-sm space-y-3">
                          <div className="bg-black/20 p-3 rounded-md border border-white/5">
                            <strong className="text-red-400 text-xs uppercase tracking-wider block mb-1">Issue</strong> 
                            <span className="text-white/90 leading-relaxed">{issue.description}</span>
                          </div>
                          <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
                            <strong className="text-cyan-400 text-xs uppercase tracking-wider block mb-1">Recommendation</strong> 
                            <span className="text-white/90 leading-relaxed">{issue.recommendation}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-muted-foreground">
                    <p className="bg-white/5 px-4 py-2 rounded-full border border-white/10">{selectedReview.status === 'COMPLETED' ? "🎉 No issues detected. Code looks solid!" : "Waiting for review to complete..."}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-muted-foreground absolute inset-0">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
              <FileCheck2 className="w-10 h-10 opacity-40 text-primary" />
            </div>
            <p className="text-lg">Select a review from the history to view details</p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: History Pane (Hidden on mobile if a review is selected) */}
      {/* On mobile: not full-height — capped to ~5 items then scrolls */}
      <div className={`w-full lg:w-[280px] xl:w-[320px] flex-col min-h-0 lg:h-full ${selectedReview ? "hidden lg:flex" : "flex mt-0 lg:mt-0"}`}>
        <Card className="overflow-hidden flex flex-col border-white/10 glassmorphism shadow-lg lg:h-full lg:flex-1">
          <CardHeader className="pb-2 border-b border-white/5 bg-white/[0.02] flex flex-row justify-between items-center px-4 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> History
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchReviews} className="hover:bg-white/10 w-8 h-8 rounded-full"><RefreshCw className="w-4 h-4 text-muted-foreground" /></Button>
          </CardHeader>
          <div className="px-3 pb-3 pt-3 border-b border-white/5 bg-black/10 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background/50 border-white/10 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50 rounded-full"
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar max-h-[375px] lg:max-h-none lg:flex-1 min-h-0">
            <div className="p-3 space-y-2">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => handleViewReview(rev.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${selectedReview?.id === rev.id ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/5 bg-black/20 hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="text-[10px] border-white/10 bg-black/40">{rev.mode}</Badge>
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${rev.status === 'COMPLETED' ? 'bg-green-500 text-green-500' : rev.status === 'FAILED' ? 'bg-red-500 text-red-500' : 'bg-yellow-500 text-yellow-500 animate-pulse'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium flex justify-between items-center mt-1">
                    {new Date(rev.createdAt).toLocaleDateString()}
                    <span className="text-[10px] opacity-70">{new Date(rev.createdAt).toLocaleTimeString()}</span>
                  </p>
                </div>
              ))}
              {filteredReviews.length === 0 && (
                <p className="text-center text-sm text-muted-foreground p-6 border border-white/5 border-dashed rounded-lg mt-4 mx-2">
                  {searchQuery ? "No reviews match your search." : "No reviews yet."}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}