"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut, Plus, Trash2, FolderCode, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, logout } = useAuthStore();
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
    try {
      await api.post("/projects", { name, description });
      toast.success("Project created successfully!");
      setIsDialogOpen(false);
      setName("");
      setDescription("");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to create project");
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

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Projects Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your code review projects.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/settings')}><Settings className="w-4 h-4 mr-2" /> Settings</Button>
          <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Your Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" /> New Project</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Add a new project to start reviewing code.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl border-muted-foreground/25">
          <FolderCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="text-muted-foreground mt-1">Create a project to start analyzing code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div>Files: {project._count.files}</div>
                  <div>Reviews: {project._count.reviews}</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="secondary">Open Project</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
