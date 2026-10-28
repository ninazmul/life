"use client";

import { useState, useTransition, useRef } from "react";
import {
  ArrowLeft,
  Pencil,
  Heart,
  FileText,
  Plus,
  ChevronRight,
  Info,
  Calendar,
  Building,
  User,
  Trash2,
  ExternalLink,
  Upload,
  X,
  Loader2,
  Paperclip,
  Check,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ProfileData,
  HealthReportItem,
  MedicalHistoryItem,
  updateHealthOverview,
  addMedicalHistoryEntry,
  updateMedicalHistoryEntry,
  deleteMedicalHistoryEntry,
  addHealthReport,
  deleteHealthReport,
} from "@/lib/actions/lifeProfile.actions";
import toast from "react-hot-toast";

interface HealthProfileViewProps {
  profile: ProfileData;
  onBack: () => void;
  onProfileUpdated: (updated: ProfileData) => void;
}

export function HealthProfileView({
  profile,
  onBack,
  onProfileUpdated,
}: HealthProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");
  const [isPending, startTransition] = useTransition();

  // Modal / Drawer states
  const [editOverviewOpen, setEditOverviewOpen] = useState(false);
  const [medicalHistoryDrawerOpen, setMedicalHistoryDrawerOpen] = useState(false);
  const [addHistoryOpen, setAddHistoryOpen] = useState(false);
  const [editingHistoryItem, setEditingHistoryItem] = useState<MedicalHistoryItem | null>(null);
  const [addReportOpen, setAddReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReportItem | null>(null);

  // Key Info form state
  const [bloodGroup, setBloodGroup] = useState(profile.bloodGroup || "");
  const [allergies, setAllergies] = useState(profile.allergies || "");
  const [hasNoAllergies, setHasNoAllergies] = useState(profile.hasNoAllergies || false);
  const [medicalConditions, setMedicalConditions] = useState(profile.medicalConditions || "");
  const [currentMedicines, setCurrentMedicines] = useState(profile.currentMedicines || "");

  // Add/Edit Medical History form state
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyCondition, setHistoryCondition] = useState("");
  const [historyDateRange, setHistoryDateRange] = useState("");
  const [historyHospital, setHistoryHospital] = useState("");
  const [historyNotes, setHistoryNotes] = useState("");

  // Add Report form state
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("Lab Report");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportHospital, setReportHospital] = useState("");
  const [reportDoctor, setReportDoctor] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [reportFileUrl, setReportFileUrl] = useState("");
  const [reportFileType, setReportFileType] = useState("application/pdf");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open edit overview form
  const handleOpenEditOverview = () => {
    setBloodGroup(profile.bloodGroup || "");
    setAllergies(profile.allergies || "");
    setHasNoAllergies(profile.hasNoAllergies || false);
    setMedicalConditions(profile.medicalConditions || "");
    setCurrentMedicines(profile.currentMedicines || "");
    setEditOverviewOpen(true);
  };

  const handleSaveOverview = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateHealthOverview({
        bloodGroup: bloodGroup.trim(),
        allergies: hasNoAllergies ? "None reported" : allergies.trim(),
        hasNoAllergies,
        medicalConditions: medicalConditions.trim(),
        currentMedicines: currentMedicines.trim(),
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Health information updated!");
        setEditOverviewOpen(false);
      } else {
        toast.error(res.error || "Failed to update health info");
      }
    });
  };

  // Add / Edit medical history entry
  const handleOpenAddHistory = (item?: MedicalHistoryItem) => {
    if (item) {
      setEditingHistoryItem(item);
      setHistoryTitle(item.title);
      setHistoryCondition(item.condition);
      setHistoryDateRange(item.dateRange);
      setHistoryHospital(item.hospitalOrDoctor || "");
      setHistoryNotes(item.notes || "");
    } else {
      setEditingHistoryItem(null);
      setHistoryTitle("");
      setHistoryCondition("");
      setHistoryDateRange("");
      setHistoryHospital("");
      setHistoryNotes("");
    }
    setAddHistoryOpen(true);
  };

  const handleSaveHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingHistoryItem) {
        res = await updateMedicalHistoryEntry({
          id: editingHistoryItem.id,
          title: historyTitle.trim(),
          condition: historyCondition.trim(),
          dateRange: historyDateRange.trim(),
          hospitalOrDoctor: historyHospital.trim(),
          notes: historyNotes.trim(),
        });
      } else {
        res = await addMedicalHistoryEntry({
          title: historyTitle.trim(),
          condition: historyCondition.trim(),
          dateRange: historyDateRange.trim(),
          hospitalOrDoctor: historyHospital.trim(),
          notes: historyNotes.trim(),
        });
      }

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success(editingHistoryItem ? "Medical history updated!" : "Medical history entry added!");
        setAddHistoryOpen(false);
      } else {
        toast.error(res.error || "Failed to save history");
      }
    });
  };

  const handleDeleteHistory = (id: string) => {
    if (!confirm("Are you sure you want to delete this medical history entry?")) return;
    startTransition(async () => {
      const res = await deleteMedicalHistoryEntry(id);
      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Medical history entry deleted");
      } else {
        toast.error(res.error || "Failed to delete entry");
      }
    });
  };

  // Report File Upload handler
  const handleReportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setReportFileType(file.type || "application/pdf");
    const reader = new FileReader();
    reader.onloadend = () => {
      setReportFileUrl(reader.result as string);
      toast.success("File attached!");
    };
    reader.readAsDataURL(file);
  };

  // Add Report submit
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) {
      toast.error("Report title is required");
      return;
    }

    if (!reportFileUrl) {
      toast.error("Please attach a document or image file");
      return;
    }

    startTransition(async () => {
      const res = await addHealthReport({
        title: reportTitle.trim(),
        category: "medical",
        fileUrl: reportFileUrl,
        fileType: reportFileType,
        issueDate: reportDate,
        issuingAuthority: reportHospital.trim() || reportDoctor.trim(),
        doctor: reportDoctor.trim(),
        notes: reportNotes.trim(),
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Health report added successfully!");
        setAddReportOpen(false);
        setReportTitle("");
        setReportFileUrl("");
        setReportNotes("");
      } else {
        toast.error(res.error || "Failed to add report");
      }
    });
  };

  const handleDeleteReport = (reportId: string) => {
    if (!confirm("Are you sure you want to delete this medical report?")) return;
    startTransition(async () => {
      const res = await deleteHealthReport(reportId);
      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Report deleted");
        setSelectedReport(null);
      } else {
        toast.error(res.error || "Failed to delete report");
      }
    });
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-slate-100 leading-tight">
              Health Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Medical history, reports & care
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenEditOverview}
          className="h-8 px-3 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[#6D28D9] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Tabs Selector: Overview | Reports */}
      <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "overview"
              ? "bg-[#6D28D9] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-[#1E1B4B]"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "reports"
              ? "bg-[#6D28D9] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-[#1E1B4B]"
          }`}
        >
          Reports ({profile.healthReports?.length || 0})
        </button>
      </div>

      {/* ───────────────── OVERVIEW TAB ───────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Key Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#1E1B4B] dark:text-slate-100 font-bold text-sm">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                Key Information
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">Blood group</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {profile.bloodGroup || "Not added"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">Allergies</span>
                <span className="font-semibold text-[#1E1B4B] dark:text-slate-100">
                  {profile.hasNoAllergies
                    ? "None reported"
                    : profile.allergies || "Not added"}
                </span>
              </div>
              <div className="flex items-start justify-between py-2.5">
                <span className="text-slate-500 flex items-center gap-1">
                  Medical conditions
                  <Info className="w-3 h-3 text-slate-400" />
                </span>
                <span className="font-semibold text-[#1E1B4B] dark:text-slate-100 text-right max-w-[60%]">
                  {profile.medicalConditions || "Not added"}
                </span>
              </div>
              <div className="flex items-start justify-between py-2.5">
                <span className="text-slate-500">Current medicines</span>
                <span className="font-semibold text-[#1E1B4B] dark:text-slate-100 text-right max-w-[60%]">
                  {profile.currentMedicines || "Not added"}
                </span>
              </div>
            </div>
          </div>

          {/* Medical History Row / Card */}
          <div
            onClick={() => setMedicalHistoryDrawerOpen(true)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex items-center justify-between cursor-pointer hover:border-purple-200 dark:hover:border-purple-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                  Medical History
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Past conditions, treatments & care ({profile.medicalHistory?.length || 0})
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Health Reports Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#1E1B4B] dark:text-slate-100 font-bold text-sm">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Health Reports
              </div>
              <button
                type="button"
                onClick={() => setAddReportOpen(true)}
                className="h-7 px-2.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Report
              </button>
            </div>

            {(!profile.healthReports || profile.healthReports.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 stroke-[1.75]" />
                </div>
                <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                  No reports added
                </p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Upload medical reports, test results or doctor notes to keep them in one place.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {profile.healthReports.slice(0, 3).map((report) => (
                  <div
                    key={report._id}
                    onClick={() => setSelectedReport(report)}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                          {report.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {report.issueDate || "Recent"} {report.issuingAuthority ? `• ${report.issuingAuthority}` : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}

                {profile.healthReports.length > 3 && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("reports")}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View all {profile.healthReports.length} reports →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────── REPORTS TAB ───────────────── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              All Medical Reports ({profile.healthReports?.length || 0})
            </p>
            <button
              type="button"
              onClick={() => setAddReportOpen(true)}
              className="h-8 px-3 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Report
            </button>
          </div>

          {(!profile.healthReports || profile.healthReports.length === 0) ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100/90 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 stroke-[1.75]" />
              </div>
              <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                No reports added
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Keep prescriptions, blood test results, and diagnostic scans safe and easily accessible here.
              </p>
              <button
                type="button"
                onClick={() => setAddReportOpen(true)}
                className="mt-2 h-9 px-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#6D28D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Report
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {profile.healthReports.map((report) => (
                <div
                  key={report._id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex items-center justify-between cursor-pointer hover:border-purple-200 dark:hover:border-purple-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                        {report.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{report.issueDate || "Undated"}</span>
                        {report.issuingAuthority && <span>• {report.issuingAuthority}</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────── EDIT KEY HEALTH INFO SHEET ───────────────── */}
      <Sheet open={editOverviewOpen} onOpenChange={setEditOverviewOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Edit Health Information
              </SheetTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update blood group, allergies, conditions and medicines
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditOverviewOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveOverview} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Blood group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              >
                <option value="">Select blood group</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Allergies
              </label>
              <input
                type="text"
                disabled={hasNoAllergies}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Peanuts, Dust"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs disabled:bg-slate-100 disabled:opacity-50"
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasNoAllergies"
                  checked={hasNoAllergies}
                  onChange={(e) => setHasNoAllergies(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="hasNoAllergies" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  No known allergies (None reported)
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Medical conditions
              </label>
              <input
                type="text"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="e.g. Hypertension, Asthma, Diabetes"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Current medicines
              </label>
              <textarea
                rows={3}
                value={currentMedicines}
                onChange={(e) => setCurrentMedicines(e.target.value)}
                placeholder="e.g. Amlodipine 5mg (once daily after breakfast)"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs resize-none"
              />
            </div>

            <div className="pt-3 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditOverviewOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Information"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ───────────────── MEDICAL HISTORY DRAWER ───────────────── */}
      <Sheet open={medicalHistoryDrawerOpen} onOpenChange={setMedicalHistoryDrawerOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Medical History
              </SheetTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Past treatments, surgeries & chronic health records
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMedicalHistoryDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Entries ({profile.medicalHistory?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => handleOpenAddHistory()}
                className="h-7 px-2.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Entry
              </button>
            </div>

            {(!profile.medicalHistory || profile.medicalHistory.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No past medical history recorded. Tap &quot;Add Entry&quot; to keep surgical or hospital records.
              </div>
            ) : (
              <div className="space-y-2.5">
                {profile.medicalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAddHistory(item)}
                          className="p-1 text-slate-400 hover:text-purple-600"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {item.condition && (
                      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {item.condition}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      {item.dateRange && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.dateRange}
                        </span>
                      )}
                      {item.hospitalOrDoctor && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {item.hospitalOrDoctor}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ───────────────── ADD/EDIT HISTORY ENTRY SHEET ───────────────── */}
      <Sheet open={addHistoryOpen} onOpenChange={setAddHistoryOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] max-h-[90vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                {editingHistoryItem ? "Edit Medical History" : "Add Medical History"}
              </SheetTitle>
              <p className="text-xs text-slate-500">Record treatment, surgery or doctor visits</p>
            </div>
            <button
              type="button"
              onClick={() => setAddHistoryOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveHistory} className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Title / Procedure *
              </label>
              <input
                type="text"
                required
                value={historyTitle}
                onChange={(e) => setHistoryTitle(e.target.value)}
                placeholder="e.g. Appendectomy Surgery"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Condition or Treatment
              </label>
              <input
                type="text"
                value={historyCondition}
                onChange={(e) => setHistoryCondition(e.target.value)}
                placeholder="e.g. Acute Appendicitis"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Date / Year
                </label>
                <input
                  type="text"
                  value={historyDateRange}
                  onChange={(e) => setHistoryDateRange(e.target.value)}
                  placeholder="e.g. Mar 2023"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Hospital / Doctor
                </label>
                <input
                  type="text"
                  value={historyHospital}
                  onChange={(e) => setHistoryHospital(e.target.value)}
                  placeholder="e.g. Evercare Hospital"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                rows={2}
                value={historyNotes}
                onChange={(e) => setHistoryNotes(e.target.value)}
                placeholder="Key details, recovery outcomes or physician recommendations"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs resize-none"
              />
            </div>

            <div className="pt-3 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAddHistoryOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Entry"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ───────────────── ADD HEALTH REPORT SHEET ───────────────── */}
      <Sheet open={addReportOpen} onOpenChange={setAddReportOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Add Health Report
              </SheetTitle>
              <p className="text-xs text-slate-500 mt-0.5">Upload and organize a medical test or prescription</p>
            </div>
            <button
              type="button"
              onClick={() => setAddReportOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveReport} className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC) Report"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="Lab Report">Lab Report</option>
                  <option value="Blood Test">Blood Test</option>
                  <option value="Prescription">Prescription</option>
                  <option value="X-Ray / Scan">X-Ray / Imaging</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Doctor Note">Doctor Note</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Report Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Hospital / Diagnostic Centre
                </label>
                <input
                  type="text"
                  value={reportHospital}
                  onChange={(e) => setReportHospital(e.target.value)}
                  placeholder="e.g. Square Hospital"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Doctor (optional)
                </label>
                <input
                  type="text"
                  value={reportDoctor}
                  onChange={(e) => setReportDoctor(e.target.value)}
                  placeholder="e.g. Dr. Ahmed"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* File Attachment Upload */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Attachment (PDF / Image) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleReportFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-300 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50"
              >
                {reportFileUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <Check className="w-4 h-4" />
                    File attached ({reportFileType})
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tap to upload file
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 5MB</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                rows={2}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Optional notes or doctor remarks"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs resize-none"
              />
            </div>

            <div className="pt-3 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAddReportOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Report"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ───────────────── REPORT DETAIL DRAWER ───────────────── */}
      {selectedReport && (
        <Sheet open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <SheetContent
            side="bottom"
            className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                  {selectedReport.title}
                </SheetTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedReport.issueDate || "Undated"} {selectedReport.issuingAuthority ? `• ${selectedReport.issuingAuthority}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Attachment Preview / Action */}
              {selectedReport.fileUrl && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">
                        Attachment Available
                      </p>
                      <p className="text-[10px] text-slate-400">{selectedReport.fileType}</p>
                    </div>
                  </div>
                  <a
                    href={selectedReport.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open File
                  </a>
                </div>
              )}

              {selectedReport.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 leading-relaxed">
                    {selectedReport.notes}
                  </p>
                </div>
              )}

              {/* Delete Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteReport(selectedReport._id)}
                  disabled={isPending}
                  className="w-full h-11 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
