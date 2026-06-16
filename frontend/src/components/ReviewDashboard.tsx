"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Play, FileCheck2, AlertCircle, AlertTriangle, Info, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ReviewDashboard({ projectId }: { projectId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [reviewMode, setReviewMode] = useState<string>("SECURITY");
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

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
      fetchReviews();
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
      {/* Left sidebar: Trigger and List */}
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
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-lg">History</CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchReviews}><RefreshCw className="w-4 h-4" /></Button>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {reviews.map((rev) => (
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
              {reviews.length === 0 && (
                <p className="text-center text-sm text-muted-foreground p-4">No reviews yet.</p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Right side: Review Details */}
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
