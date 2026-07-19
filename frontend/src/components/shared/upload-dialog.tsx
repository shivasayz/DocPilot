import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadFile } from "@/lib/api";
import { getToken } from "@/lib/auth";

export function UploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const startUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setPct(0);
    const token = getToken() ?? undefined;

    let completed = 0;
    for (const file of files) {
      try {
        await uploadFile(file, token);
      } catch (e: any) {
        toast.error(`Failed to upload ${file.name}`, { description: e.message });
      }
      completed++;
      setPct(Math.round((completed / files.length) * 100));
    }

    setUploading(false);
    toast.success(`Uploaded ${completed} file${completed > 1 ? "s" : ""}`, {
      description: "Processing in the background.",
    });
    setFiles([]);
    onOpenChange(false);
    setPct(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            PDF, CSV up to 50 MB each. Files are parsed, chunked, and embedded.
          </DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          className={`relative grid cursor-pointer place-items-center rounded-lg border border-dashed p-8 text-center transition-colors ${
            drag ? "border-accent bg-accent/5" : "border-border bg-surface/40 hover:bg-surface/60"
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf,.csv"
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="grid size-10 place-items-center rounded-lg bg-muted">
            <Upload className="size-4" />
          </div>
          <div className="mt-3 text-sm font-medium">Drop files or click to browse</div>
          <div className="text-xs text-muted-foreground">PDF · CSV</div>
        </label>

        {files.length > 0 && (
          <div className="max-h-40 space-y-1.5 overflow-y-auto scrollbar-thin">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-border bg-surface/50 px-2.5 py-1.5 text-xs"
              >
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                <button
                  onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="space-y-1.5">
            <Progress value={pct} className="h-1.5" />
            <div className="text-[11px] text-muted-foreground">Uploading… {pct}%</div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={startUpload} disabled={!files.length || uploading}>
            {uploading ? "Uploading…" : `Upload ${files.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
