"use client";

import { useState, useRef } from "react";
import { uploadEvidenceFile, deleteEvidenceFile } from "@/lib/api";

interface EvidenceUploadProps {
  fileId?: string;
  initialFileName?: string;
  onChange: (fileId: string | null) => void;
  moduleName: string;
  organizationId: string;
}

export default function EvidenceUpload({
  fileId,
  initialFileName,
  onChange,
  moduleName,
  organizationId
}: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Chỉ chấp nhận tập tin định dạng PDF.");
      return;
    }

    // Validate size (<= 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError("Dung lượng tập tin vượt quá giới hạn (tối đa 20MB).");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const data = await uploadEvidenceFile(file, moduleName, organizationId);
      if (data && data.id) {
        setFileName(file.name);
        onChange(data.id);
      } else {
        setError("Tải lên thất bại. Không nhận được phản hồi hợp lệ.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi tải lên tập tin.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Bạn có chắc muốn xóa minh chứng này?")) return;
    setError(null);
    
    // If we have a file ID, soft delete it
    if (fileId) {
      try {
        await deleteEvidenceFile(fileId);
      } catch (err: any) {
        console.error("Lỗi xóa file trên server:", err);
      }
    }

    setFileName(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Chỉ chấp nhận tập tin định dạng PDF.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Dung lượng tập tin vượt quá giới hạn (tối đa 20MB).");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const data = await uploadEvidenceFile(file, moduleName, organizationId);
      if (data && data.id) {
        setFileName(file.name);
        onChange(data.id);
      } else {
        setError("Tải lên thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi tải lên tập tin.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {fileId ? (
        // File uploaded state
        <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xl">📄</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate" title={fileName || "Minh chứng.pdf"}>
                {fileName || "Minh chứng.pdf"}
              </p>
              <a
                href={`http://localhost:5023/api/v1/evidence-files/download/${fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-all"
              >
                Tải xuống minh chứng
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-all shrink-0"
          >
            Xóa
          </button>
        </div>
      ) : (
        // Dropzone state
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-950/20 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          {uploading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"></span>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Đang tải lên tập tin PDF...</p>
            </>
          ) : (
            <>
              <span className="text-2xl">📤</span>
              <p className="text-xs text-slate-300 font-semibold">Tải lên file minh chứng PDF</p>
              <p className="text-[10px] text-slate-500">Kéo thả file PDF hoặc click để chọn (tối đa 20MB)</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[10px] text-red-400 font-bold flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
