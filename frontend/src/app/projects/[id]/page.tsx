"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Code, MessageSquareCode, FileSearch, Upload, GitPullRequest, Sparkles, X, FileUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import CodeExplorer from "@/components/CodeExplorer";
import ReviewDashboard from "@/components/ReviewDashboard";
import AIChat from "@/components/AIChat";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuthStore();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    } else {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch {
      toast.error("Failed to load project details");
    }
  };

  const handleUploadZip = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      await api.post(`/projects/${projectId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Codebase uploaded successfully!");
      setShowUploadOptions(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadZip(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const zipFile = Array.from(files).find(f => f.name.endsWith('.zip'));
      if (zipFile) {
        handleUploadZip(zipFile);
      } else {
        toast.error("Please drop a .zip file");
      }
    }
  }, [projectId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleImportGitHub = async () => {
    if (!githubUrl.trim()) return;
    setIsImporting(true);
    try {
      await api.post(`/projects/${projectId}/files/github`, { repoUrl: githubUrl });
      toast.success("Repository imported successfully!");
      setGithubUrl("");
      setShowUploadOptions(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to import repository");
    } finally {
      setIsImporting(false);
    }
  };

  if (!project) return <div className="p-8 text-center animate-pulse">Loading project...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-muted/10">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Code className="w-5 h-5 text-primary"/> {project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <div className="relative">
            <Button onClick={() => setShowUploadOptions(!showUploadOptions)} disabled={isUploading}>
              {isUploading ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploading ? "Uploading..." : "Upload Code"}
            </Button>
            {showUploadOptions && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-card border rounded-xl shadow-xl z-50 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Upload Source Code</h3>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowUploadOptions(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Option 1: ZIP Upload */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                  <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop ZIP file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or import from GitHub</span>
                  </div>
                </div>

                {/* Option 2: GitHub URL */}
                <div className="flex gap-2">
                  <Input
                    placeholder="https://github.com/owner/repo"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleImportGitHub} disabled={isImporting || !githubUrl.trim()} size="sm">
                    <GitPullRequest className="w-4 h-4 mr-1" />
                    {isImporting ? "..." : "Import"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Tabs defaultValue="explorer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="explorer" className="flex gap-2"><Code className="w-4 h-4" /> Code Explorer</TabsTrigger>
            <TabsTrigger value="reviews" className="flex gap-2"><FileSearch className="w-4 h-4" /> AI Reviews</TabsTrigger>
            <TabsTrigger value="chat" className="flex gap-2"><MessageSquareCode className="w-4 h-4" /> AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="explorer" className="mt-0">
            <CodeExplorer projectId={projectId} />
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <ReviewDashboard projectId={projectId} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <AIChat projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}