"use client";

import useConfirmation from "@/components/useConfirmation";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { apiMessage, uploadEvidenceFile, deleteEvidenceFile } from "@/lib/api";

interface EvidenceUploadProps {
  fileId?: string;
  initialFileName?: string | null;
  onChange: (fileId: string | null) => void;
  moduleName: string;
  organizationId: string;
}

export default function EvidenceUpload({ fileId, initialFileName, onChange, moduleName, organizationId }: EvidenceUploadProps) {
  const { confirm, confirmationDialog } = useConfirmation();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string }>();
  const fileName = uploadedFile?.id === fileId ? uploadedFile?.name : initialFileName;

  async function upload(file?: File) {
    if (!file || pending.current || fileId || !organizationId) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Chỉ chấp nhận tệp PDF.");
      return;
    }
    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
      setError("Tệp PDF phải có dung lượng từ 1 byte đến 20 MB.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await uploadEvidenceFile(file, moduleName, organizationId);
      setUploadedFile({ id: data.id, name: data.originalFileName });
      onChange(data.id);
    } catch (error) {
      setError(apiMessage(error, "Không thể tải tệp lên. Vui lòng thử lại."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function remove() {
    if (!fileId || pending.current || !await confirm("Xóa tệp minh chứng này?")) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await deleteEvidenceFile(fileId);
      setUploadedFile(undefined);
      onChange(null);
    } catch (error) {
      setError(apiMessage(error, "Không thể xóa tệp minh chứng."));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <div className="space-y-2">
    {confirmationDialog}
    {fileId ? <div className="flex flex-wrap items-center gap-3 rounded-lg border border-edge p-3">
      <FileText size={17} aria-hidden="true" />
      <a href={`/api/v1/evidence-files/download/${fileId}`} className="min-w-0 grow break-all font-semibold text-brand-strong underline">
        {fileName || "Tải xuống minh chứng"}
      </a>
      <button type="button" onClick={remove} disabled={busy}
        className="rounded bg-danger-soft px-3 py-2 font-semibold text-danger-strong disabled:opacity-60">Xóa tệp</button>
    </div> : <label className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-edge px-3 py-4 text-ink"
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        void upload(event.dataTransfer.files[0]);
      }}>
      <Upload size={17} aria-hidden="true" />
      <span className="basis-full text-sm font-semibold">Tải lên minh chứng PDF (tối đa 20 MB)</span>
      <input type="file" accept=".pdf,application/pdf" disabled={busy || !organizationId}
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void upload(file);
        }}
        className="w-full min-w-0 text-xs file:mr-2 file:rounded file:bg-soft-strong file:px-2 file:py-1 file:text-ink disabled:opacity-60" />
      {!organizationId && <span>Chọn đơn vị hoặc đoàn viên trước khi tải tệp.</span>}
    </label>}
    {busy && <p role="status" className="text-copy">Đang xử lý tệp…</p>}
    {error && <p role="alert" className="text-danger">{error}</p>}
  </div>;
}
