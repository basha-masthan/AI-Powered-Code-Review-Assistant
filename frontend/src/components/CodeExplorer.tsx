"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Folder, File, Code } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function CodeExplorer({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/files`);
      setFiles(res.data);
    } catch {
      toast.error("Failed to load files");
    }
  };

  const handleSelectFile = async (file: any) => {
    setSelectedFile(file);
    try {
      const res = await api.get(`/projects/${projectId}/files/${file.id}`);
      setFileContent(res.data.content);
    } catch {
      toast.error("Failed to load file content");
      setFileContent("");
    }
  };

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'json': return 'json';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'md': return 'markdown';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'text';
    }
  };

  return (
    <div className="flex h-[600px] border rounded-md overflow-hidden">
      {/* Sidebar Tree */}
      <div className="w-1/3 border-r bg-muted/20 flex flex-col">
        <div className="p-3 font-semibold border-b bg-muted/40 flex items-center gap-2">
          <Folder className="w-4 h-4" /> Files
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {files.map((file) => (
              <div 
                key={file.id} 
                onClick={() => handleSelectFile(file)}
                className={`p-2 text-sm rounded-md cursor-pointer flex items-center gap-2 transition-colors ${selectedFile?.id === file.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <File className="w-4 h-4 shrink-0" />
                <span className="truncate">{file.path}</span>
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center text-sm text-muted-foreground p-4">No files uploaded.</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedFile ? (
          <>
            <div className="p-3 border-b flex justify-between items-center bg-muted/10">
              <div className="flex items-center gap-2 font-mono text-sm">
                <Code className="w-4 h-4 text-muted-foreground" />
                {selectedFile.path}
              </div>
              <Badge variant="secondary">{getLanguage(selectedFile.path)}</Badge>
            </div>
            <ScrollArea className="flex-1 bg-[#1E1E1E]">
              <SyntaxHighlighter 
                language={getLanguage(selectedFile.path)} 
                style={vscDarkPlus}
                customStyle={{ margin: 0, background: 'transparent', fontSize: '14px' }}
                showLineNumbers
              >
                {fileContent}
              </SyntaxHighlighter>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <Code className="w-12 h-12 opacity-20" />
            <p>Select a file to view its content</p>
          </div>
        )}
      </div>
    </div>
  );
}
