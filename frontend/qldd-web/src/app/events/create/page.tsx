"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, FormSection, ActionButton, StatusBadge } from "@/components/ui-components";
import {
  createEventApi,
  getMasterDepartmentsApi,
  getMasterPersonsApi,
  getMasterLocationsApi,
  getMasterDevicesApi
} from "@/lib/api";
import { toast } from "react-hot-toast";

const steps = [
  "Thông tin chung",
  "Phiên & Quy tắc",
  "Địa điểm & Thiết bị",
  "Thành phần tham dự"
];

export default function CreateEventWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Data
  const [locations, setLocations] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    organizer: "",
    contactPerson: "",
    notes: "",

    sessions: [
      {
        sessionName: "Phiên 1",
        date: "",
        startTime: "08:00:00",
        endTime: "12:00:00",
        displayOrder: 1,
        attendanceRules: [
          { attendanceType: "CHECK_IN", windowStart: "07:30:00", referenceTime: "08:00:00", windowEnd: "08:15:00", required: true, displayOrder: 1 },
          { attendanceType: "CHECK_OUT", windowStart: "11:45:00", referenceTime: "12:00:00", windowEnd: "12:30:00", required: true, displayOrder: 2 }
        ]
      }
    ],

    locationIds: [] as string[],
    deviceIds: [] as string[],

    participantConfig: {
      participantType: "NO_PREDEFINED_LIST",
      departments: [] as string[],
      persons: [] as string[]
    }
  });

  useEffect(() => {
    Promise.all([
      getMasterLocationsApi(),
      getMasterDevicesApi(),
      getMasterDepartmentsApi(),
      getMasterPersonsApi()
    ]).then(([locs, devs, depts, pers]) => {
      setLocations(locs);
      setDevices(devs);
      setDepartments(depts);
      setPersons(pers);
    }).catch(() => toast.error("Lỗi tải dữ liệu danh mục"));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.name || !formData.code) {
        toast.error("Vui lòng nhập đầy đủ Mã và Tên sự kiện (*)");
        return false;
      }
    }
    if (currentStep === 1) {
      for (let i = 0; i < formData.sessions.length; i++) {
        const s = formData.sessions[i];
        if (!s.date) {
          toast.error(`Phiên ${i + 1}: Vui lòng chọn ngày`);
          return false;
        }
        if (!s.startTime || !s.endTime) {
          toast.error(`Phiên ${i + 1}: Vui lòng nhập thời gian bắt đầu và kết thúc`);
          return false;
        }
        for (let j = 0; j < s.attendanceRules.length; j++) {
          const r = s.attendanceRules[j];
          if (!r.windowStart || !r.windowEnd) {
            toast.error(`Phiên ${i + 1}, Quy tắc ${j + 1}: Vui lòng nhập thời gian Mở và Đóng`);
            return false;
          }
        }
      }
    }
    if (currentStep === 2) {
      if (formData.locationIds.length === 0) {
        toast.error("Sự kiện phải có ít nhất 1 địa điểm");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep() && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      organizer: formData.organizer,
      contactPerson: formData.contactPerson,
      notes: formData.notes,
      locationIds: formData.locationIds,
      deviceIds: formData.deviceIds,
      sessions: formData.sessions.map(s => ({
        sessionName: s.sessionName,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        displayOrder: s.displayOrder,
        rules: s.attendanceRules
      })),
      participantConfig: {
        participantType: formData.participantConfig.participantType === 'SPECIFIC_DEPARTMENTS' ? 'BY_DEPARTMENT' : formData.participantConfig.participantType,
        departmentIds: formData.participantConfig.departments,
        personIds: formData.participantConfig.persons
      }
    };

    try {
      await createEventApi(payload);
      toast.success("Tạo sự kiện thành công");
      router.push("/events");
    } catch (error: any) {
      console.error("Create event error:", error.response?.data);
      const data = error.response?.data;
      if (data?.errors) {
        // ASP.NET validation errors format
        const allErrors = Object.entries(data.errors)
          .filter(([key]) => key !== 'command') // skip generic model binding error
          .map(([, msgs]) => (msgs as string[])[0]);
        if (allErrors.length > 0) {
          toast.error(allErrors[0]);
        } else {
          toast.error(data.title || "Dữ liệu không hợp lệ");
        }
      } else if (data?.message) {
        toast.error(data.message);
      } else if (typeof data === 'string') {
        toast.error(data);
      } else {
        toast.error("Tạo sự kiện thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelection = (list: string[], item: string, setter: (newList: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(x => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Tạo mới sự kiện"
        description="Thiết lập sự kiện điểm danh theo 4 bước"
      >
        <ActionButton type="secondary" onClick={() => router.push("/events")}>
          Hủy bỏ
        </ActionButton>
      </PageHeader>

      {/* Stepper indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs flex justify-between items-center px-8 relative">
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        {steps.map((label, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 bg-white px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${idx <= currentStep ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-400"
              }`}>
              {idx + 1}
            </div>
            <span className={`text-xs font-semibold ${idx <= currentStep ? "text-emerald-700" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs min-h-[400px]">

        {/* STEP 0: Thông tin chung */}
        {currentStep === 0 && (
          <FormSection title="Thông tin chung" description="Nhập thông tin cơ bản về sự kiện">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Mã sự kiện <span className="text-red-500">*</span></label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20" placeholder="VD: EVT-001" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Tên sự kiện <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Thời gian bắt đầu <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Thời gian kết thúc <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-600">Mô tả chi tiết</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Đơn vị tổ chức</label>
              <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </FormSection>
        )}

        {/* STEP 1: Ca trực & Quy tắc */}
        {currentStep === 1 && (
          <FormSection title="Ca trực & Quy tắc" description="Thiết lập các ca làm việc/điểm danh">
            <div className="col-span-2 space-y-4">
              {formData.sessions.map((session, sIdx) => (
                <div key={sIdx} className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl relative">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-emerald-800 text-sm">Phiên (Ca) {sIdx + 1}</h4>
                    {formData.sessions.length > 1 && (
                      <button
                        onClick={() => {
                          const newSessions = [...formData.sessions];
                          newSessions.splice(sIdx, 1);
                          setFormData({ ...formData, sessions: newSessions });
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold bg-white px-2 py-1 rounded-md border border-red-200"
                      >
                        Xóa ca này
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Tên ca</label>
                      <input type="text" value={session.sessionName} onChange={e => {
                        const newSessions = [...formData.sessions];
                        newSessions[sIdx].sessionName = e.target.value;
                        setFormData({ ...formData, sessions: newSessions });
                      }} className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600">Ngày</label>
                      <input type="date" value={session.date} onChange={e => {
                        const newSessions = [...formData.sessions];
                        newSessions[sIdx].date = e.target.value;
                        setFormData({ ...formData, sessions: newSessions });
                      }} className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-sm" />
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-700 mb-2">Quy tắc điểm danh</h5>
                  {session.attendanceRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl mb-3">
                      <div className="w-24 shrink-0">
                        <StatusBadge
                          status={rule.attendanceType === 'CHECK_IN' ? 'Check-in' : 'Check-out'}
                          type={rule.attendanceType === 'CHECK_IN' ? 'info' : 'warning'}
                          className="text-xs px-3 py-1"
                        />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mở (Bắt đầu)</label>
                          <input
                            type="time"
                            step="1"
                            value={rule.windowStart}
                            onChange={(e) => {
                              const newSessions = [...formData.sessions];
                              newSessions[sIdx].attendanceRules[idx].windowStart = e.target.value;
                              // Auto set referenceTime to match windowStart for backend compatibility
                              newSessions[sIdx].attendanceRules[idx].referenceTime = e.target.value;
                              setFormData({ ...formData, sessions: newSessions });
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đóng (Kết thúc)</label>
                          <input
                            type="time"
                            step="1"
                            value={rule.windowEnd}
                            onChange={(e) => {
                              const newSessions = [...formData.sessions];
                              newSessions[sIdx].attendanceRules[idx].windowEnd = e.target.value;
                              setFormData({ ...formData, sessions: newSessions });
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <button
                onClick={() => {
                  const newSessions = [...formData.sessions];
                  newSessions.push({
                    sessionName: `Ca ${newSessions.length + 1}`,
                    date: "",
                    startTime: "08:00:00",
                    endTime: "12:00:00",
                    displayOrder: newSessions.length + 1,
                    attendanceRules: [
                      { attendanceType: "CHECK_IN", windowStart: "07:30:00", referenceTime: "07:30:00", windowEnd: "08:15:00", required: true, displayOrder: 1 },
                      { attendanceType: "CHECK_OUT", windowStart: "11:45:00", referenceTime: "11:45:00", windowEnd: "12:30:00", required: true, displayOrder: 2 }
                    ]
                  });
                  setFormData({ ...formData, sessions: newSessions });
                }}
                className="w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors"
              >
                + Thêm ca trực
              </button>
            </div>
          </FormSection>
        )}

        {/* STEP 2: Địa điểm & Thiết bị */}
        {currentStep === 2 && (
          <FormSection title="Phạm vi điểm danh" description="Chọn địa điểm và thiết bị áp dụng">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700">Địa điểm</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                {locations.map(loc => (
                  <label key={loc.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={formData.locationIds.includes(loc.id)}
                      onChange={() => toggleSelection(formData.locationIds, loc.id, (v) => setFormData({ ...formData, locationIds: v }))}
                    />
                    <span className="font-semibold text-slate-700">{loc.name}</span>
                    <span className="text-xs text-slate-400">({loc.code})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700">Thiết bị</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                {devices.filter(d => formData.locationIds.includes(d.locationId)).map(dev => (
                  <label key={dev.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={formData.deviceIds.includes(dev.id)}
                      onChange={() => toggleSelection(formData.deviceIds, dev.id, (v) => setFormData({ ...formData, deviceIds: v }))}
                    />
                    <span className="font-semibold text-slate-700">{dev.deviceName}</span>
                    <span className="text-xs text-slate-400">({dev.deviceCode})</span>
                  </label>
                ))}
                {devices.filter(d => formData.locationIds.includes(d.locationId)).length === 0 && (
                  <div className="text-sm text-slate-500 italic p-2">Vui lòng chọn địa điểm trước hoặc không có thiết bị nào trong địa điểm đã chọn.</div>
                )}
              </div>
            </div>
          </FormSection>
        )}

        {/* STEP 3: Thành phần */}
        {currentStep === 3 && (
          <FormSection title="Thành phần tham dự" description="Cấu hình đối tượng tham gia">
            <div className="col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Loại cấu hình</label>
                <select
                  value={formData.participantConfig.participantType}
                  onChange={e => setFormData({
                    ...formData,
                    participantConfig: { ...formData.participantConfig, participantType: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="NO_PREDEFINED_LIST">Không có danh sách (Mở tự do)</option>
                  <option value="SPECIFIC_DEPARTMENTS">Theo phòng ban</option>
                  <option value="SPECIFIC_PERSONS">Theo từng cá nhân</option>
                </select>
              </div>

              {formData.participantConfig.participantType === 'SPECIFIC_DEPARTMENTS' && (
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Chọn Phòng ban</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {departments.map(dept => (
                      <label key={dept.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={formData.participantConfig.departments.includes(dept.id)}
                          onChange={() => toggleSelection(formData.participantConfig.departments, dept.id, (v) => setFormData({ ...formData, participantConfig: { ...formData.participantConfig, departments: v } }))}
                        />
                        <span className="font-semibold text-slate-700">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.participantConfig.participantType === 'SPECIFIC_PERSONS' && (
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Chọn Nhân viên</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {persons.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={formData.participantConfig.persons.includes(p.id)}
                          onChange={() => toggleSelection(formData.participantConfig.persons, p.id, (v) => setFormData({ ...formData, participantConfig: { ...formData.participantConfig, persons: v } }))}
                        />
                        <span className="font-semibold text-slate-700">{p.fullName}</span>
                        <span className="text-xs text-slate-400">({p.code})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between mt-6">
        <ActionButton type="secondary" disabled={currentStep === 0} onClick={prevStep}>
          &larr; Quay lại
        </ActionButton>
        {currentStep < steps.length - 1 ? (
          <ActionButton type="primary" onClick={nextStep}>
            Tiếp tục &rarr;
          </ActionButton>
        ) : (
          <ActionButton type="success" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Hoàn tất & Lưu"}
          </ActionButton>
        )}
      </div>

    </div>
  );
}
