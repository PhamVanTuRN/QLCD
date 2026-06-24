"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getQualityPeriodsApi, 
  getQualityEvaluationApi, 
  calculateQualityApi, 
  saveQualityEvaluationApi, 
  getManualInputsApi, 
  saveManualInputsApi, 
  getFlattenedUnits,
  QualityEvaluationPeriodDto,
  QualityEvaluationDto,
  SummaryStatsDto,
  getDownloadUrl,
  uploadEvidenceFile,
  deleteEvidenceFile
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calculator, 
  Info, 
  Save, 
  FileText, 
  RotateCcw,
  Check,
  AlertCircle
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui-components";
import EvidenceUpload from "@/components/EvidenceUpload";

const getRatingColor = (rating: string) => {
  switch (rating) {
    case "Xuất sắc": return "bg-emerald-50 text-emerald-700 border-emerald-250/60";
    case "Vững mạnh": return "bg-blue-50 text-blue-700 border-blue-250/60";
    case "Hoàn thành tốt": return "bg-amber-50 text-amber-700 border-amber-250/60";
    case "Hoàn thành": return "bg-slate-50 text-slate-700 border-slate-250/60";
    default: return "bg-red-50 text-red-700 border-red-250/60";
  }
};

export default function QualityPage() {
  const { user } = useAuth();
  
  // Selection filters
  const [organizations, setOrganizations] = useState<{ id: string; tenDonVi: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [periods, setPeriods] = useState<QualityEvaluationPeriodDto[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q2");

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluation, setEvaluation] = useState<QualityEvaluationDto | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStatsDto | null>(null);
  
  // Modal & Manual Input States
  const [showEvalModal, setShowEvalModal] = useState<boolean>(false);
  const [savingInputs, setSavingInputs] = useState<boolean>(false);
  const [draftEvaluation, setDraftEvaluation] = useState<QualityEvaluationDto | null>(null);
  const [notes, setNotes] = useState<string>("");
  
  // Manual inputs form fields
  const [valQ1, setValQ1] = useState<number>(0); // Tổng số CNVCLĐ
  const [valQ4, setValQ4] = useState<number>(0); // Số giới thiệu Đảng
  const [valQ7, setValQ7] = useState<number>(0); // Nữ trong BCH %
  const [valQ8, setValQ8] = useState<number>(0); // Kỷ luật
  const [valQ10, setValQ10] = useState<number>(0); // Hài lòng %

  // Load organizations and periods on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const orgList = await getFlattenedUnits();
        setOrganizations(orgList);
        if (orgList.length > 0) {
          const defaultOrg = user?.donViId && orgList.some(o => o.id === user.donViId)
            ? user.donViId
            : orgList[0]?.id;
          setSelectedOrgId(defaultOrg || "");
        }

        const periodList = await getQualityPeriodsApi();
        setPeriods(periodList);
        if (periodList.length > 0) {
          // Default to the first open period or Q2/2026
          const defaultPeriod = periodList.find(p => p.trangThai === 1) || periodList[0];
          setSelectedYear(defaultPeriod.nam);
          setSelectedPeriod(defaultPeriod.ky);
        }
      } catch (err) {
        console.error("Lỗi khi load bộ lọc:", err);
      }
    }
    loadFilters();
  }, [user]);

  // Fetch evaluation data
  const fetchData = useCallback(async () => {
    if (!selectedOrgId || !selectedYear || !selectedPeriod) return;
    setLoading(true);
    try {
      const res = await getQualityEvaluationApi(selectedOrgId, selectedYear, selectedPeriod);
      if (res && res.success) {
        setEvaluation(res.data);
        setSummaryStats(res.summaryStats);
        setNotes(res.data?.ghiChu || "");
      } else {
        setEvaluation(null);
        setSummaryStats(null);
      }
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu đánh giá chất lượng:", err);
      setEvaluation(null);
      setSummaryStats(null);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, selectedYear, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open modal and load existing manual inputs
  const handleOpenEvalModal = async () => {
    try {
      const inputs = await getManualInputsApi(selectedOrgId, selectedYear, selectedPeriod);
      // Map back to inputs
      const q1 = inputs.find(i => i.criteriaMa === "Q1")?.value || 0;
      const q4 = inputs.find(i => i.criteriaMa === "Q4")?.value || 0;
      const q7 = inputs.find(i => i.criteriaMa === "Q7")?.value || 0;
      const q8 = inputs.find(i => i.criteriaMa === "Q8")?.value || 0;
      const q10 = inputs.find(i => i.criteriaMa === "Q10")?.value || 0;

      setValQ1(q1);
      setValQ4(q4);
      setValQ7(q7);
      setValQ8(q8);
      setValQ10(q10);

      setDraftEvaluation(null);
      setShowEvalModal(true);
    } catch (err) {
      alert("Lỗi khi tải số liệu nhập tay: " + err);
    }
  };

  // Run draft calculation
  const handleCalculateDraft = async () => {
    try {
      const res = await calculateQualityApi({
        organizationId: selectedOrgId,
        year: selectedYear,
        period: selectedPeriod,
        manualInputs: [
          { criteriaMa: "Q1", value: valQ1 },
          { criteriaMa: "Q4", value: valQ4 },
          { criteriaMa: "Q7", value: valQ7 },
          { criteriaMa: "Q8", value: valQ8 },
          { criteriaMa: "Q10", value: valQ10 },
        ]
      });

      if (res && res.success) {
        setDraftEvaluation(res.data);
      }
    } catch (err) {
      alert("Lỗi khi tính toán số liệu dự thảo: " + err);
    }
  };

  // Save manual inputs and evaluation result
  const handleSaveEvaluation = async () => {
    const evalToSave = draftEvaluation || evaluation;
    if (!evalToSave) return;

    setSavingInputs(true);
    try {
      // 1. Save manual inputs
      await saveManualInputsApi({
        organizationId: selectedOrgId,
        year: selectedYear,
        period: selectedPeriod,
        inputs: [
          { criteriaMa: "Q1", value: valQ1 },
          { criteriaMa: "Q4", value: valQ4 },
          { criteriaMa: "Q7", value: valQ7 },
          { criteriaMa: "Q8", value: valQ8 },
          { criteriaMa: "Q10", value: valQ10 },
        ]
      });

      // 2. Save evaluation
      const payload = {
        organizationId: selectedOrgId,
        year: selectedYear,
        period: selectedPeriod,
        tongDiem: evalToSave.tongDiem,
        xepLoai: evalToSave.xepLoai,
        datSoTieuChi: evalToSave.datSoTieuChi,
        tongSoTieuChi: evalToSave.tongSoTieuChi,
        ghiChu: notes,
        details: evalToSave.details.map(d => ({
          criteriaId: d.criteriaId,
          criteriaMa: d.ma,
          mucTieu: d.mucTieu,
          thucTe: d.thucTe,
          isPassed: d.isPassed,
          diemSo: d.diemSo,
          fileMinhChungUrl: d.fileMinhChungUrl || null,
          ghiChu: d.ghiChu || null
        }))
      };

      await saveQualityEvaluationApi(payload);
      setShowEvalModal(false);
      fetchData();
      alert("Lưu kết quả đánh giá thành công!");
    } catch (err) {
      alert("Lỗi khi lưu kết quả đánh giá: " + err);
    } finally {
      setSavingInputs(false);
    }
  };

  // Update specific evidence file in evaluation details directly
  const handleEvidenceChange = async (criteriaId: string, fileId: string | null) => {
    if (!evaluation) return;

    try {
      const updatedDetails = evaluation.details.map(d => {
        if (d.criteriaId === criteriaId) {
          return { ...d, fileMinhChungUrl: fileId };
        }
        return d;
      });

      const payload = {
        organizationId: evaluation.donViCongDoanId,
        year: selectedYear,
        period: selectedPeriod,
        tongDiem: evaluation.tongDiem,
        xepLoai: evaluation.xepLoai,
        datSoTieuChi: evaluation.datSoTieuChi,
        tongSoTieuChi: evaluation.tongSoTieuChi,
        ghiChu: notes,
        details: updatedDetails.map(d => ({
          criteriaId: d.criteriaId,
          criteriaMa: d.ma,
          mucTieu: d.mucTieu,
          thucTe: d.thucTe,
          isPassed: d.isPassed,
          diemSo: d.diemSo,
          fileMinhChungUrl: d.fileMinhChungUrl || null,
          ghiChu: d.ghiChu || null
        }))
      };

      await saveQualityEvaluationApi(payload);
      fetchData();
    } catch (err) {
      alert("Lỗi cập nhật file minh chứng: " + err);
    }
  };

  const getProgressColor = (actual: number, target: number, isInverse = false) => {
    if (isInverse) {
      return actual <= target ? "bg-emerald-500" : "bg-red-500";
    }
    const ratio = actual / target;
    if (ratio >= 1) return "bg-emerald-500";
    if (ratio >= 0.9) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusIcon = (isPassed: boolean) => {
    return isPassed ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
    );
  };

  const currentPeriodRecord = periods.find(p => p.nam === selectedYear && p.ky === selectedPeriod);
  const isPeriodLocked = currentPeriodRecord?.trangThai === 2;

  // Render organization selector based on user scope
  const availableOrgs = organizations;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <PageHeader 
        title="Tiêu chuẩn Chất lượng Công đoàn" 
        description="Đánh giá, xếp loại CĐCS vững mạnh xuất sắc theo bộ tiêu chí của Tổng LĐLĐ Việt Nam"
      >
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Đơn vị Công đoàn</span>
            <select 
              value={selectedOrgId} 
              onChange={e => setSelectedOrgId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[200px]"
            >
              {availableOrgs.map(o => (
                <option key={o.id} value={o.id}>{o.tenDonVi}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Năm đánh giá</span>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value={2026}>Năm 2026</option>
              <option value={2025}>Năm 2025</option>
              <option value={2024}>Năm 2024</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kỳ đánh giá</span>
            <select 
              value={selectedPeriod} 
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="Q1">Quý 1</option>
              <option value="Q2">Quý 2</option>
              <option value="Q3">Quý 3</option>
              <option value="Q4">Quý 4</option>
              <option value="YEAR">Cả năm</option>
            </select>
          </div>

          {evaluation && !isPeriodLocked && (
            <div className="flex flex-col justify-end pt-5">
              <button
                onClick={handleOpenEvalModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Tính toán lại
              </button>
            </div>
          )}
        </div>
      </PageHeader>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 h-28" />
            ))}
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl h-96" />
        </div>
      ) : !evaluation ? (
        /* Empty State */
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-12 text-center max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-slate-350" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800">Chưa có kết quả đánh giá</h3>
            <p className="text-xs text-slate-655 max-w-md mx-auto">
              Đơn vị này chưa có dữ liệu đánh giá chất lượng cho kỳ <strong>{selectedPeriod}/{selectedYear}</strong>. Vui lòng thực hiện tính toán số liệu.
            </p>
          </div>
          {!isPeriodLocked ? (
            <button
              onClick={handleOpenEvalModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4.5 h-4.5" />
              Tính toán & Đánh giá ngay
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              Kỳ đánh giá này đã khóa chốt sổ
            </div>
          )}
        </div>
      ) : (
        /* Data Loaded View */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Overall Rating Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Xếp loại chất lượng"
              value={evaluation.xepLoai}
              subtitle={
                <span>
                  Đạt <span className="font-bold text-emerald-600">{evaluation.datSoTieuChi}/{evaluation.tongSoTieuChi}</span> tiêu chí — Kỳ {selectedPeriod}/{selectedYear}
                </span>
              }
              icon={Award}
              color={evaluation.xepLoai === "Xuất sắc" ? "emerald" : evaluation.xepLoai === "Vững mạnh" ? "blue" : "amber"}
            />
            
            <StatCard
              title="CĐBP Xuất sắc"
              value={summaryStats ? `${summaryStats.subUnitsExcellent} / ${summaryStats.subUnitsTotal}` : "0 / 0"}
              subtitle={
                summaryStats ? (
                  `${summaryStats.subUnitsStrong} Vững mạnh • ${summaryStats.subUnitsGood} H.Thành Tốt`
                ) : (
                  "Chưa có thống kê đơn vị cấp dưới"
                )
              }
              icon={Users}
              color="blue"
            />
            
            <StatCard
              title="Tổng điểm số"
              value={`${evaluation.tongDiem}/100`}
              subtitle={
                <span>
                  Đánh giá bởi: <span className="font-bold text-slate-700">{evaluation.nguoiDanhGia || "Hệ thống"}</span>
                </span>
              }
              icon={TrendingUp}
              color="purple"
            />
          </div>

          {/* Criteria Evaluation Table */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bộ Tiêu chí Đánh giá ({evaluation.details.length} tiêu chí)
              </span>
              <div className="flex gap-2 items-center">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getRatingColor(evaluation.xepLoai)}`}>
                  {evaluation.xepLoai}
                </span>
                {isPeriodLocked && (
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-550 border border-slate-200">
                    Đã khóa sổ
                  </span>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs table-modern">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-6 py-4 w-8 text-center"></th>
                    <th className="px-6 py-4">Mã</th>
                    <th className="px-6 py-4">Tiêu chí</th>
                    <th className="px-6 py-4">Phân loại</th>
                    <th className="px-6 py-4">Mục tiêu</th>
                    <th className="px-6 py-4">Thực tế</th>
                    <th className="px-6 py-4 w-44">Tiến độ</th>
                    <th className="px-6 py-4 text-center">Điểm số</th>
                    <th className="px-6 py-4 text-center">Kết quả</th>
                    <th className="px-6 py-4 w-60">Minh chứng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {evaluation.details.map(d => {
                    const isInverse = d.ma === "Q8";
                    const percent = isInverse
                      ? (d.mucTieu === 0 && d.thucTe === 0 ? 100 : Math.max(0, 100 - (d.thucTe / Math.max(d.mucTieu, 1)) * 100))
                      : Math.min(100, (d.thucTe / Math.max(d.mucTieu, 1)) * 100);

                    return (
                      <tr key={d.criteriaId} className="hover:bg-slate-50/40 transition-all">
                        <td className="px-6 py-4 text-center">{getStatusIcon(d.isPassed)}</td>
                        <td className="px-6 py-4 font-bold text-slate-400 uppercase">{d.ma}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 max-w-xs">{d.ten}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50 text-slate-655 font-bold">
                            {d.phanLoai}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">
                          {isInverse ? `≤ ${d.mucTieu}` : `≥ ${d.mucTieu}`} {d.donViTinh}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">
                          {d.thucTe} {d.donViTinh}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/30">
                            <div 
                              className={`h-2 rounded-full transition-all duration-700 ${getProgressColor(d.thucTe, d.mucTieu, isInverse)}`} 
                              style={{ width: `${percent}%` }} 
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-slate-800 text-sm">
                          {d.diemSo} <span className="text-[10px] text-slate-400 font-bold">/10</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            d.isPassed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                              : "bg-red-50 text-red-700 border-red-200/60"
                          }`}>
                            {d.isPassed ? "Đạt" : "Chưa đạt"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!isPeriodLocked ? (
                            <EvidenceUpload
                              fileId={d.fileMinhChungUrl || undefined}
                              initialFileName={d.fileMinhChungUrl ? `MinhChung_${d.ma}.pdf` : undefined}
                              onChange={(fileId) => handleEvidenceChange(d.criteriaId, fileId)}
                              moduleName="quality_evaluation"
                              organizationId={selectedOrgId}
                            />
                          ) : d.fileMinhChungUrl ? (
                            <a
                              href={getDownloadUrl(d.fileMinhChungUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-4.5 h-4.5" />
                              Tải minh chứng
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Không có minh chứng</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Notes Section */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/10 space-y-2">
              <label className="text-xs font-bold text-slate-655 block">Ý kiến nhận xét / Ghi chú chung</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isPeriodLocked}
                placeholder="Nhập nhận xét chung về kết quả đánh giá chất lượng công đoàn của đơn vị trong kỳ này..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 resize-none h-20 transition-all"
              />
              {!isPeriodLocked && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveEvaluation}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Lưu nhận xét
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Calculation Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-150 rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Tính toán & Đánh giá chất lượng
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Đơn vị: {organizations.find(o => o.id === selectedOrgId)?.tenDonVi} • Kỳ: {selectedPeriod}/{selectedYear}
                </p>
              </div>
              <button 
                onClick={() => setShowEvalModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inputs Form */}
              <div className={`${draftEvaluation ? 'lg:col-span-5 border-r border-slate-100 pr-2' : 'lg:col-span-12'} space-y-4`}>
                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  Nhập các số liệu thủ công
                </h4>

                <div className="space-y-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-655 flex justify-between">
                      <span>Tổng số CNVCLĐ trong đơn vị</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Tiêu chí Q1</span>
                    </label>
                    <input
                      type="number"
                      value={valQ1}
                      onChange={e => setValQ1(Number(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      placeholder="Ví dụ: 120"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-655 flex justify-between">
                      <span>Số lượng giới thiệu kết nạp Đảng</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Tiêu chí Q4</span>
                    </label>
                    <input
                      type="number"
                      value={valQ4}
                      onChange={e => setValQ4(Number(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      placeholder="Ví dụ: 6"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-655 flex justify-between">
                      <span>Tỉ lệ nữ trong BCH công đoàn (%)</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Tiêu chí Q7</span>
                    </label>
                    <input
                      type="number"
                      value={valQ7}
                      onChange={e => setValQ7(Number(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      placeholder="Ví dụ: 28.5"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-655 flex justify-between">
                      <span>Số vụ vi phạm kỷ luật công đoàn</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Tiêu chí Q8</span>
                    </label>
                    <input
                      type="number"
                      value={valQ8}
                      onChange={e => setValQ8(Number(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      placeholder="Ví dụ: 0"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-655 flex justify-between">
                      <span>Tỉ lệ đoàn viên đánh giá hài lòng (%)</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Tiêu chí Q10</span>
                    </label>
                    <input
                      type="number"
                      value={valQ10}
                      onChange={e => setValQ10(Number(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      placeholder="Ví dụ: 95"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCalculateDraft}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-in fade-in"
                  >
                    <Calculator className="w-4.5 h-4.5" />
                    Xem kết quả dự thảo
                  </button>
                </div>
              </div>

              {/* Draft Results Preview */}
              {draftEvaluation && (
                <div className="lg:col-span-7 space-y-4 animate-in slide-in-from-right duration-300">
                  <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Kết quả dự thảo tự động
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getRatingColor(draftEvaluation.xepLoai)}`}>
                      {draftEvaluation.xepLoai}
                    </span>
                  </h4>

                  {/* Stat overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng điểm dự kiến</div>
                      <div className="text-lg font-extrabold text-slate-800 mt-1">{draftEvaluation.tongDiem} / 100</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Số tiêu chí đạt</div>
                      <div className="text-lg font-extrabold text-slate-800 mt-1">{draftEvaluation.datSoTieuChi} / {draftEvaluation.tongSoTieuChi}</div>
                    </div>
                  </div>

                  {/* Mini criteria list */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs max-h-[300px] overflow-y-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2 text-center w-8"></th>
                          <th className="px-3 py-2">Mã</th>
                          <th className="px-3 py-2">Tiêu chí</th>
                          <th className="px-3 py-2 text-right">Thực tế</th>
                          <th className="px-3 py-2 text-right">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-655 font-medium">
                        {draftEvaluation.details.map(d => (
                          <tr key={d.ma} className="hover:bg-slate-50/50">
                            <td className="px-4 py-1.5 text-center">{getStatusIcon(d.isPassed)}</td>
                            <td className="px-3 py-1.5 font-bold uppercase text-[10px] text-slate-400">{d.ma}</td>
                            <td className="px-3 py-1.5 font-bold text-slate-750 truncate max-w-[200px]">{d.ten}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-slate-800">{d.thucTe}{d.donViTinh}</td>
                            <td className="px-3 py-1.5 text-right font-extrabold text-slate-800">{d.diemSo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
              <button
                onClick={() => setShowEvalModal(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveEvaluation}
                disabled={savingInputs || (!draftEvaluation && !evaluation)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savingInputs ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu & Chốt kết quả
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
