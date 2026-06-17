"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Code, MessageSquareCode, FileSearch, Upload, GitPullRequest, Sparkles, X, FileUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import CodeExplorer from "@/components/CodeExplorer";
import ReviewDashboard from "@/components/ReviewDashboard";
import AIChat from "@/components/AIChat";

const TABS = [
  { value: "explorer", label: "Code Explorer", icon: Code },
  { value: "reviews",  label: "AI Reviews",   icon: FileSearch },
  { value: "chat",     label: "AI Chat",       icon: MessageSquareCode },
];

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("explorer");
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
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false); dragCounter.current = 0;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const zipFile = Array.from(files).find(f => f.name.endsWith('.zip'));
      if (zipFile) handleUploadZip(zipFile);
      else toast.error("Please drop a .zip file");
    }
  }, [projectId]);

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const handleImportGitHub = async () => {
    if (!githubUrl.trim()) return;
    setIsImporting(true);
    try {
      await api.post(`/projects/${projectId}/files/github`, { repoUrl: githubUrl });
      toast.success("Repository imported successfully!");
      setGithubUrl(""); setShowUploadOptions(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to import repository");
    } finally { setIsImporting(false); }
  };

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Sparkles className="w-8 h-8 text-fuchsia-400 animate-pulse" />
        <p className="text-muted-foreground text-sm">Loading project...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Clean Glassmorphic Header ─────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Left: back + project name */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0 w-8 h-8 hover:bg-white/5 rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate flex items-center gap-2">
                <Code className="w-4 h-4 text-fuchsia-400 shrink-0" />
                {project.name}
              </h1>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate">{project.description}</p>
              )}
            </div>
          </div>

          {/* Right: Upload button + dropdown */}
          <div className="relative shrink-0">
            <Button
              size="sm"
              onClick={() => setShowUploadOptions(!showUploadOptions)}
              disabled={isUploading}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white h-8 px-3 text-xs gap-1.5"
            >
              {isUploading
                ? <Sparkles className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isUploading ? "Uploading…" : "Upload Code"}</span>
            </Button>

            {showUploadOptions && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glassmorphism border border-white/10 rounded-2xl shadow-2xl z-50 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Upload Source Code</h3>
                  <button onClick={() => setShowUploadOptions(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div
                  onDrop={handleDrop} onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragOver ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-white/10 hover:border-fuchsia-500/50 hover:bg-white/5'
                  }`}
                >
                  <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                  <FileUp className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop ZIP here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1 border-t border-white/10" />
                  or import from GitHub
                  <span className="flex-1 border-t border-white/10" />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://github.com/owner/repo"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    className="flex-1 h-9 bg-background/50 border-white/10 text-sm"
                  />
                  <Button onClick={handleImportGitHub} disabled={isImporting || !githubUrl.trim()} size="sm" className="h-9 shrink-0">
                    <GitPullRequest className="w-4 h-4 mr-1" />
                    {isImporting ? "…" : "Import"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Responsive Smart Tab Bar ─────────────────────────────────── */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-4">
        <div className="flex gap-1 p-1 glassmorphism border border-white/5 rounded-2xl w-fit">
          {TABS.map(({ value, label, icon: Icon }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.35)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {/*
                  Active tab: ALWAYS show the label (even on tiny screens)
                  Inactive tabs: hide label on tiny screens (<sm), show from sm+
                */}
                <span className={isActive ? "inline" : "hidden sm:inline"}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4">
        {activeTab === "explorer" && <CodeExplorer projectId={projectId} />}
        {activeTab === "reviews"  && <ReviewDashboard projectId={projectId} />}
        {activeTab === "chat"     && <AIChat projectId={projectId} />}
      </div>

    </div>
  );
}