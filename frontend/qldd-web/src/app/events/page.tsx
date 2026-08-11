"use client";

import { useEffect, useState } from "react";
import { PageHeader, DataTable, StatusBadge, ActionButton, EmptyState, ConfirmDialog } from "@/components/ui-components";
import { getEventsApi, deleteEventApi, publishEventApi, duplicateEventApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await getEventsApi({ pageIndex: 1, pageSize: 50 });
      setEvents(res.items || res.data || []);
      setTotalCount(res.totalCount || 0);
    } catch (error) {
      toast.error("Không thể tải danh sách sự kiện");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEventApi(deleteId);
      toast.success("Xóa sự kiện thành công");
      fetchEvents();
    } catch {
      toast.error("Xóa sự kiện thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishEventApi(id);
      toast.success("Đã công bố sự kiện");
      fetchEvents();
    } catch {
      toast.error("Công bố sự kiện thất bại");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateEventApi(id);
      toast.success("Đã nhân bản sự kiện");
      fetchEvents();
    } catch {
      toast.error("Nhân bản sự kiện thất bại");
    }
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case "DRAFT": return "default";
      case "PUBLISHED": return "info";
      case "ONGOING": return "success";
      case "COMPLETED": return "purple";
      case "CANCELLED": return "error";
      default: return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT": return "Nháp";
      case "PUBLISHED": return "Đã công bố";
      case "ONGOING": return "Đang diễn ra";
      case "COMPLETED": return "Đã kết thúc";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Quản lý Sự kiện"
        description="Danh sách sự kiện và cấu hình điểm danh"
      >
        <ActionButton type="primary" href="/events/create">
          <span className="mr-1">➕</span> Tạo sự kiện mới
        </ActionButton>
      </PageHeader>

      <DataTable
        title="Danh sách sự kiện"
        headers={["Mã sự kiện", "Tên sự kiện", "Thời gian", "Trạng thái", "Thao tác"]}
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage="Chưa có sự kiện nào trong hệ thống."
      >
        {events.map((evt) => (
          <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-3 font-medium text-slate-800">{evt.code}</td>
            <td className="px-6 py-3 font-semibold text-emerald-700">{evt.name}</td>
            <td className="px-6 py-3">
              <div className="text-[11px]">
                <div><span className="text-slate-400">Từ:</span> {new Date(evt.startDate).toLocaleString('vi-VN')}</div>
                <div><span className="text-slate-400">Đến:</span> {new Date(evt.endDate).toLocaleString('vi-VN')}</div>
              </div>
            </td>
            <td className="px-6 py-3">
              <StatusBadge status={getStatusText(evt.status)} type={getStatusType(evt.status)} />
            </td>
            <td className="px-6 py-3">
              <div className="flex gap-2">
                <ActionButton type="secondary" href={`/events/${evt.id}`}>
                  Chi tiết
                </ActionButton>
                {evt.status === 'DRAFT' && (
                  <ActionButton type="info" onClick={() => handlePublish(evt.id)}>
                    Công bố
                  </ActionButton>
                )}
                <ActionButton type="warning" onClick={() => handleDuplicate(evt.id)}>
                  Nhân bản
                </ActionButton>
                <ActionButton type="danger" onClick={() => setDeleteId(evt.id)}>
                  Xóa
                </ActionButton>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Xác nhận xóa sự kiện"
        message="Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
