"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, MessageSquareCode, FileSearch, Sparkles, Upload } from "lucide-react";
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

  const handleUploadZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      await api.post(`/projects/${projectId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Codebase uploaded successfully!");
      // Reload page to reflect new files
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <div>
            <input 
              type="file" 
              accept=".zip" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleUploadZip} 
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploading ? "Uploading..." : "Upload ZIP"}
            </Button>
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
