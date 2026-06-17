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
import { RefreshCw, Play, FileCheck2, AlertCircle, AlertTriangle, Info, Search, FileText, Beaker } from "lucide-react";

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

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New AI Review</CardTitle>
            <CardDescription>Run an analysis on the codebase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={selectedProvider} onValueChange={(val) => setSelectedProvider(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Review Template</Label>
              <Select value={reviewMode} onValueChange={(val) => setReviewMode(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SECURITY">Security Review</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance Review</SelectItem>
                  <SelectItem value="CODE_QUALITY">Code Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleTriggerReview} disabled={isTriggering}>
              {isTriggering ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Start Review
            </Button>
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bonus Tools</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleGenerateDocs}>
                  <FileText className="w-3.5 h-3.5 mr-1" /> Docs
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleGenerateTests}>
                  <Beaker className="w-3.5 h-3.5 mr-1" /> Tests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-lg">History</CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchReviews}><RefreshCw className="w-4 h-4" /></Button>
          </CardHeader>
          <div className="px-2 pb-2 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-7 pl-8 text-xs"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 pt-0 space-y-2">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => handleViewReview(rev.id)}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors ${selectedReview?.id === rev.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="outline">{rev.mode}</Badge>
                    <Badge variant={rev.status === 'COMPLETED' ? 'default' : rev.status === 'FAILED' ? 'destructive' : 'secondary'}>
                      {rev.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(rev.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {filteredReviews.length === 0 && (
                <p className="text-center text-sm text-muted-foreground p-4">
                  {searchQuery ? "No reviews match your search." : "No reviews yet."}
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="flex-1 border rounded-xl overflow-hidden bg-card flex flex-col">
        {selectedReview ? (
          <>
            <div className="p-6 border-b bg-muted/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileCheck2 className="w-6 h-6 text-primary" /> {selectedReview.mode} Analysis
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Status: {selectedReview.status} | {new Date(selectedReview.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-background border p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReview.summary || "No summary available. Analysis might still be pending."}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {selectedReview.issues && selectedReview.issues.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Detected Issues ({selectedReview.issues.length})</h3>
                  {selectedReview.issues.map((issue: any) => (
                    <Card key={issue.id} className="border-l-4" style={{ borderLeftColor: issue.severity === 'CRITICAL' ? '#ef4444' : issue.severity === 'HIGH' ? '#f97316' : issue.severity === 'MEDIUM' ? '#eab308' : '#3b82f6' }}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(issue.severity)}
                          <CardTitle className="text-md">{issue.severity}</CardTitle>
                          {issue.lineNumber && <Badge variant="outline" className="ml-auto">Line {issue.lineNumber}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 text-sm space-y-2">
                        <div><strong className="text-foreground">Issue:</strong> <span className="text-muted-foreground">{issue.description}</span></div>
                        <div><strong className="text-foreground">Recommendation:</strong> <span className="text-muted-foreground">{issue.recommendation}</span></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p>{selectedReview.status === 'COMPLETED' ? "No issues detected. Code looks good!" : "Waiting for review to complete..."}</p>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-muted-foreground">
            <FileCheck2 className="w-16 h-16 opacity-20" />
            <p>Select a review from the history to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}