"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { formatBytes } from "@/lib/converters/image";

interface FileDropzoneProps {
  accept?: string;
  maxSizeMb?: number;
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  title?: string;
  description?: string;
}

export function FileDropzone({
  accept,
  onFileSelect,
  selectedFile,
  onClear,
  title = "Drop file here or click to browse",
  description = "Processed 100% locally in your browser",
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <FileIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-zinc-500">
              {formatBytes(selectedFile.size)} • {selectedFile.type || "Unknown type"}
            </p>
          </div>
        </div>
        {onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            title="Remove file"
            aria-label="Remove selected file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
        isDragging
          ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]"
          : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-label={title || "Choose file to upload"}
        tabIndex={-1}
      />
      <div className="p-3 mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
        <UploadCloud className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 text-center">
        {title}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
        {description}
      </p>
    </div>
  );
}
