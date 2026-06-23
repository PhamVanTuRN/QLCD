"use client";

import { useState, useRef } from "react";
import { uploadEvidenceFile, deleteEvidenceFile, getDownloadUrl } from "@/lib/api";

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
    } catch (err) {
      console.error(err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tải lên tập tin.";
      setError(errorMsg);
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
      } catch (err) {
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
    } catch (err) {
      console.error(err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tải lên tập tin.";
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {fileId ? (
        // File uploaded state
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xl">📄</span>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-700 truncate" title={fileName || "Minh chứng.pdf"}>
                {fileName || "Minh chứng.pdf"}
              </p>
              <a
                href={getDownloadUrl(fileId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all"
              >
                Tải xuống minh chứng
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] text-red-600 hover:text-red-700 font-bold px-2 py-1 bg-red-50 hover:bg-red-100/80 border border-red-200/60 rounded transition-all shrink-0"
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
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 bg-slate-50/50 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
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
              <span className="inline-block w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Đang tải lên tập tin PDF...</p>
            </>
          ) : (
            <>
              <span className="text-xl">📤</span>
              <p className="text-xs text-slate-655 font-bold">Tải lên file minh chứng PDF</p>
              <p className="text-[10px] text-slate-400 font-semibold">Kéo thả file PDF hoặc click để chọn (tối đa 20MB)</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[10px] text-red-600 font-bold flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
