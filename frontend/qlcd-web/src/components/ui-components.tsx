import React from "react";
import Link from "next/link";

// 1. PageHeader Component
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // For action buttons
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}

// 2. StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  color?: "blue" | "emerald" | "amber" | "red" | "purple" | "sky" | "pink";
}

export function StatCard({ title, value, subtitle, icon: Icon, color = "blue" }: StatCardProps) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100/50",
      iconBg: "bg-blue-100/60 text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
      iconBg: "bg-emerald-100/60 text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 border-amber-100/50",
      iconBg: "bg-amber-100/60 text-amber-600",
    },
    red: {
      bg: "bg-red-50 text-red-600 border-red-100/50",
      iconBg: "bg-red-100/60 text-red-600",
    },
    purple: {
      bg: "bg-purple-50 text-purple-600 border-purple-100/50",
      iconBg: "bg-purple-100/60 text-purple-600",
    },
    sky: {
      bg: "bg-sky-50 text-sky-600 border-sky-100/50",
      iconBg: "bg-sky-100/60 text-sky-600",
    },
    pink: {
      bg: "bg-pink-50 text-pink-600 border-pink-100/50",
      iconBg: "bg-pink-100/60 text-pink-600",
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-200/60 transition-all duration-300 flex items-start justify-between">
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <div className="text-[10px] text-slate-500 font-medium">
            {subtitle}
          </div>
        )}
      </div>
      <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
        <Icon className="w-5 h-5 shrink-0" />
      </div>
    </div>
  );
}

// 3. DataTable Component
interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  totalCount?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  meta?: React.ReactNode;
}

export function DataTable({
  headers,
  children,
  totalCount,
  isLoading = false,
  emptyMessage = "Không tìm thấy kết quả nào.",
  title,
  meta,
}: DataTableProps) {
  return (
    <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
      {(title || totalCount !== undefined || meta) && (
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
          <div>
            {title && (
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {title}
              </span>
            )}
            {totalCount !== undefined && (
              <span className="text-[10px] ml-2 text-slate-500 font-medium">
                ({totalCount} kết quả)
              </span>
            )}
          </div>
          {meta && <div className="text-[10px] text-slate-500 font-medium">{meta}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs table-modern">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-3.5 text-slate-500 font-semibold border-b border-slate-100 bg-slate-50/50 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-xs font-medium text-slate-400">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : React.Children.count(children) === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-12 text-center text-slate-400 italic">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-lg">📂</span>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 4. StatusBadge Component
interface StatusBadgeProps {
  status: string;
  type?: "success" | "warning" | "error" | "info" | "default" | "purple";
  className?: string;
}

export function StatusBadge({ status, type = "default", className = "" }: StatusBadgeProps) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    error: "bg-red-50 text-red-700 border-red-200/60",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
    purple: "bg-purple-50 text-purple-700 border-purple-200/60",
    default: "bg-slate-50 text-slate-600 border-slate-200/60",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[type]} ${className}`}
    >
      {status}
    </span>
  );
}

// 5. ActionButton Component
interface ActionButtonProps {
  onClick?: () => void;
  href?: string;
  type?: "primary" | "secondary" | "danger" | "success" | "info" | "warning";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ActionButton({
  onClick,
  href,
  type = "secondary",
  children,
  className = "",
  disabled = false,
}: ActionButtonProps) {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500/20",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs focus:ring-slate-500/20",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500/20",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-red-500/20",
    info: "bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 shadow-xs focus:ring-sky-500/20",
    warning: "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-xs focus:ring-amber-500/20",
  };

  const baseClass = `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${styles[type]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClass}>
      {children}
    </button>
  );
}

// 6. EmptyState Component
export function EmptyState({ message = "Chưa có dữ liệu nào được ghi nhận." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-2xl text-center shadow-xs">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-3xl mb-4">
        📂
      </div>
      <h3 className="text-sm font-semibold text-slate-800">Không tìm thấy dữ liệu</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
    </div>
  );
}

// 7. LoadingSkeleton Component
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100/80 p-5 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="space-y-2 w-1/3">
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded" />
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// 8. FormSection Component
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
        {description && (
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

// 9. ConfirmDialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "primary" | "warning";
  isSubmitting?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  type = "primary",
  isSubmitting = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const btnColors = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-white border border-slate-150 rounded-2xl shadow-xl p-6 space-y-4 text-center animate-in scale-in duration-200">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-xl">
          {type === "danger" ? "🚨" : type === "warning" ? "⚠️" : "ℹ️"}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-850">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 ${btnColors[type]}`}
          >
            {isSubmitting ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
