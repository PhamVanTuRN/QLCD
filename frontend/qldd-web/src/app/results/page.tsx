"use client";

export default function ResultsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Kết quả Điểm danh</h2>
          <p className="text-xs text-slate-550 mt-1 font-medium">
            Kết quả tính toán điểm danh theo người tham dự
          </p>
        </div>
      </div>
      <div className="bg-white border border-slate-150 p-10 rounded-2xl shadow-xs text-center">
        <h3 className="text-lg font-bold text-slate-700 mb-2">Module đang được phát triển</h3>
        <p className="text-sm text-slate-500">Chức năng xem kết quả sẽ sớm được tích hợp.</p>
      </div>
    </div>
  );
}
