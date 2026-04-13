"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ImageIcon, Trash2, Upload } from "lucide-react";

type ImageUploadProps = {
  value: string;
  altText?: string;
  onValueChange: (url: string, altText: string) => void;
  accessToken?: string;
  apiBase?: string;
};

export function ImageUpload({
  value,
  altText = "",
  onValueChange,
  accessToken,
  apiBase = "/api/proxy",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const headers: Record<string, string> = {};
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const response = await fetch(`${apiBase}/media/upload`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const asset = await response.json();
      onValueChange(asset.url, file.name);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemove() {
    onValueChange("", "");
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative">
          <img src={value} alt={altText} className="w-full rounded-lg border object-cover aspect-square" />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {uploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
          <span className="mt-2 text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload"}</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      {value && (
        <div className="space-y-2">
          <Label className="text-xs">Alt Text</Label>
          <Input value={altText} onChange={(e) => onValueChange(value, e.target.value)} placeholder="Image description" className="text-sm" />
        </div>
      )}
    </div>
  );
}