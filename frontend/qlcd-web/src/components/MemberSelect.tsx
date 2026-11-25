"use client";

import { useCallback, useState } from "react";
import { getMembers } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function MemberSelect({ value, onChange, organizationId, selectedName, required, label = "Đoàn viên" }: {
  value: string;
  onChange: (value: string, organizationId?: string) => void;
  organizationId?: string;
  selectedName?: string | null;
  required?: boolean;
  label?: string;
}) {
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<{ id: string; text: string }>();
  const load = useCallback((signal: AbortSignal) => getMembers({
    pageSize: 30, search: search.trim() || undefined, toCongDoanId: organizationId || undefined,
  }, signal), [search, organizationId]);
  const { data, loading, error, reload } = useResource(load, 200);
  const options = data?.items ?? [];
  const field = "w-full min-w-0 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink";

  return <div className="min-w-0 space-y-2">
    <label className="block space-y-1">
      <span className="block text-sm text-copy">Tìm theo tên hoặc mã nhân viên</span>
      <input type="search" className={field} value={search} maxLength={100}
        onChange={event => setSearch(event.target.value)} />
    </label>
    <label className="block space-y-1">
      <span className="block text-sm text-copy">{label}{required ? " *" : ""}</span>
      <select className={field} value={value} required={required}
        onChange={event => {
          const member = options.find(option => option.id === event.target.value);
          if (member) setChosen({ id: member.id, text: `${member.hoTen} (${member.maNhanVien})` });
          onChange(event.target.value, member?.maToCongDoan);
        }}>
        <option value="">Chọn đoàn viên</option>
        {value && !options.some(option => option.id === value) &&
          <option value={value}>{chosen?.id === value ? chosen.text : selectedName || "Đoàn viên đã chọn"}</option>}
        {options.map(member => <option key={member.id} value={member.id}>{member.hoTen} ({member.maNhanVien})</option>)}
      </select>
    </label>
    {loading && <p role="status" className="text-copy">Đang tìm đoàn viên…</p>}
    {!loading && !error && options.length === 0 && <p role="status" className="text-copy">Không tìm thấy đoàn viên.</p>}
    {data && data.totalCount > options.length && <p className="text-copy">Nhập thêm ký tự để thu hẹp kết quả.</p>}
    {Boolean(error) && <p role="alert" className="text-danger">
      Không thể tìm đoàn viên. <button type="button" className="underline" onClick={reload}>Thử lại</button>
    </p>}
  </div>;
}
