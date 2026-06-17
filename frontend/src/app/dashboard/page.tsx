"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut, Plus, Trash2, FolderCode, Settings, FileCode2, Cpu, Activity, LayoutGrid, Code2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { user, logout, displayName } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    } else {
      fetchProjects();
    }
  }, [router]);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post("/projects", { name, description });
      toast.success("Project created successfully!");
      setIsDialogOpen(false);
      setName("");
      setDescription("");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Calculate stats
  const totalFiles = projects.reduce((acc, p) => acc + (p._count?.files || 0), 0);
  const totalReviews = projects.reduce((acc, p) => acc + (p._count?.reviews || 0), 0);

  return (
    <div className="min-h-screen animate-fade-in pb-12">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-[1px]">
              <div className="w-full h-full bg-background rounded-lg flex items-center justify-center">
                <Code2 className="w-4 h-4 text-fuchsia-400" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Strix AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Welcome Hero Section */}
        <div className="relative overflow-hidden rounded-3xl glassmorphism border border-white/5 p-8 sm:p-10 shadow-glow-fuchsia/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Welcome back{displayName ? `, ${displayName}` : ''}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl leading-relaxed">
                Manage your code review projects, trigger automated security and performance analysis, and chat with your codebase using local or cloud LLMs.
              </p>
            </div>
            <Button size="lg" onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white shadow-glow-fuchsia/20 shrink-0">
              <Plus className="w-5 h-5 mr-2" /> New Project
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="glassmorphism border-white/10 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">Create Project</DialogTitle>
                  <DialogDescription>Add a new workspace to start reviewing code.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="bg-background/50 border-white/10 focus-visible:ring-fuchsia-500/50 focus-visible:border-fuchsia-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        className="bg-background/50 border-white/10 focus-visible:ring-fuchsia-500/50 focus-visible:border-fuchsia-500/50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white">
                      {isCreating ? "Creating..." : "Create Project"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glassmorphism border-white/5 bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <h3 className="text-2xl font-bold">{projects.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-white/5 bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Files Uploaded</p>
                <h3 className="text-2xl font-bold">{totalFiles}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-white/5 bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Reviews Done</p>
                <h3 className="text-2xl font-bold">{totalReviews}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FolderCode className="w-5 h-5 text-primary" /> Your Workspaces
          </h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-24 border border-dashed rounded-3xl glassmorphism border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <FolderCode className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6 group-hover:scale-110 group-hover:text-primary transition-all duration-500" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create your first workspace to upload source code and start analyzing it with AI.</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="border-white/10 hover:bg-white/5">
                <Plus className="w-4 h-4 mr-2" /> Create First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                  <Card className="relative overflow-hidden glassmorphism border-white/5 bg-background/40 hover:bg-background/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-fuchsia/10 flex flex-col h-full cursor-pointer">
                    {/* Hover Gradient Overlay */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fuchsia-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none" />
                    
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold group-hover:text-fuchsia-400 transition-colors line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                        {project.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <div className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {project._count.files} Files
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                          {project._count.reviews} Reviews
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-white/5 pt-4 bg-black/20 mt-auto">
                      <span className="text-sm text-muted-foreground group-hover:text-fuchsia-400 transition-colors font-medium flex items-center gap-1.5">
                        Open Workspace →
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
