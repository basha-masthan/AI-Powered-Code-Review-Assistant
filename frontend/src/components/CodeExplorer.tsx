"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Folder, File, Code, ChevronRight, ChevronDown, FileCode } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  file?: any;
}

function buildTree(files: any[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  for (const file of files) {
    const parts = file.path.split('/');
    let currentPath = '';
    let parentNodes = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (i === parts.length - 1) {
        parentNodes.push({
          name: part,
          path: currentPath,
          type: 'file',
          children: [],
          file,
        });
      } else {
        let existing = parentNodes.find(n => n.name === part && n.type === 'folder');
        if (!existing) {
          existing = { name: part, path: currentPath, type: 'folder', children: [] };
          parentNodes.push(existing);
        }
        parentNodes = existing.children;
      }
    }
  }
  return root;
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  }).map(n => ({ ...n, children: sortTree(n.children) }));
}

function TreeNodeItem({
  node,
  depth,
  selectedFileId,
  onSelect,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedFileId: string | null;
  onSelect: (file: any) => void;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}) {
  const isExpanded = expanded.has(node.path);
  const isSelected = node.file?.id === selectedFileId;

  if (node.type === 'folder') {
    return (
      <div>
        <div
          onClick={() => onToggle(node.path)}
          className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md cursor-pointer transition-colors hover:bg-muted ${isExpanded ? 'bg-muted/50' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{node.name}</span>
        </div>
        {isExpanded && (
          <div>
            {node.children.map(child => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFileId={selectedFileId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(node.file)}
      className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <FileCode className="w-4 h-4 shrink-0" />
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export default function CodeExplorer({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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

  const tree = useMemo(() => {
    const raw = buildTree(files);
    return sortTree(raw);
  }, [files]);

  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce<TreeNode[]>((acc, n) => {
        const matches = n.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = n.type === 'folder' ? filterNodes(n.children) : [];
        if (matches || filteredChildren.length > 0) {
          acc.push(n.type === 'folder' ? { ...n, children: filteredChildren } : n);
        }
        return acc;
      }, []);
    };
    return filterNodes(tree);
  }, [tree, searchQuery]);

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

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  useEffect(() => {
    if (files.length > 0) {
      const dirs = new Set<string>();
      files.forEach(f => {
        const parts = f.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          dirs.add(parts.slice(0, i).join('/'));
        }
      });
      setExpanded(dirs);
    }
  }, [files]);

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
      case 'cpp': case 'c': return 'cpp';
      default: return 'text';
    }
  };

  return (
    <div className="flex h-[600px] border rounded-md overflow-hidden">
      <div className="w-1/3 border-r bg-muted/20 flex flex-col">
        <div className="p-3 font-semibold border-b bg-muted/40 flex items-center gap-2">
          <Folder className="w-4 h-4" /> Files
          <Badge variant="outline" className="ml-auto text-xs">{files.length}</Badge>
        </div>
        <div className="p-2 border-b">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="py-1">
            {filteredTree.map(node => (
              <TreeNodeItem
                key={node.path}
                node={node}
                depth={0}
                selectedFileId={selectedFile?.id}
                onSelect={handleSelectFile}
                expanded={expanded}
                onToggle={toggleExpand}
              />
            ))}
            {filteredTree.length === 0 && (
              <div className="text-center text-sm text-muted-foreground p-4">
                {searchQuery ? "No matching files." : "No files uploaded."}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

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