/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import {
  ClipboardList,
  MessageCircle,
  Plus,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Inbox,
  Loader2,
  RefreshCw,
  Lock,
  KeyRound,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  ILifeRequest,
  RequestCategory,
  RequestStatus,
  IFutureNoteItem,
  ILifeConversation,
  IConversationListItem,
} from "@/types";
import {
  createRequest,
  sendRequestMessage,
  markRequestMessagesAsRead,
  updateRequestStatus,
  cancelRequest,
} from "@/lib/actions/lifeRequest.actions";
import { requestFutureNoteAccess } from "@/lib/actions/lifeNote.actions";
import { ConversationClient } from "@/components/life/messaging/ConversationClient";
import { useRouter } from "next/navigation";

// ─── helpers ───────────────────────────────────────────────
const CATEGORY_LABELS: Record<RequestCategory, string> = {
  access_request: "Access Request",
  financial_care: "Financial Care",
  document_access: "Document Access",
  note_access: "Note Access",
  information_request: "Information Request",
  responsibility_request: "Responsibility",
  general_inquiry: "General Inquiry",
  other: "Other",
};

const STATUS_META: Record<
  RequestStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color:
      "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25",
    icon: Clock,
  },
  in_review: {
    label: "In Review",
    color:
      "text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/25",
    icon: RefreshCw,
  },
  approved: {
    label: "Approved",
    color:
      "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    color:
      "text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/25",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color:
      "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/25",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.color}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {meta.label}
    </span>
  );
}

function formatTime(date: any) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Props ─────────────────────────────────────────────────
interface Props {
  initialRequests: ILifeRequest[];
  initialFutureNotes?: IFutureNoteItem[];
  isAdmin: boolean;
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserRole: string;
  currentPersonId?: string;
  initialTab?: "all" | "pending" | "future_notes" | "resolved" | "messages";
  initialUserConversation?: ILifeConversation | null;
  initialAdminConversations?: IConversationListItem[];
  initialSelectedUserEmail?: string;
  unreadMessagesCount?: number;
}

// ─── Main Component ─────────────────────────────────────────
export function RequestCenterClient({
  initialRequests,
  initialFutureNotes = [],
  isAdmin,
  currentUserId,
  currentUserEmail,
  currentUserName,
  currentUserRole,
  currentPersonId,
  initialTab = "all",
  initialUserConversation,
  initialAdminConversations = [],
  initialSelectedUserEmail,
  unreadMessagesCount = 0,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [requests] = useState<ILifeRequest[]>(initialRequests);
  const [futureNotes, setFutureNotes] = useState<IFutureNoteItem[]>(initialFutureNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "all" | "pending" | "future_notes" | "resolved" | "messages"
  >(
    initialTab === "messages"
      ? "messages"
      : initialRequests.length === 0 && initialFutureNotes.length > 0
      ? "future_notes"
      : initialTab || "all"
  );
  const [showNewForm, setShowNewForm] = useState(false);

  // New request form
  const [newCategory, setNewCategory] = useState<RequestCategory>("general_inquiry");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Message box
  const [msgText, setMsgText] = useState("");
  const [msgError, setMsgError] = useState("");

  // Admin status update
  const [newStatus, setNewStatus] = useState<RequestStatus>("in_review");
  const [adminResponse, setAdminResponse] = useState("");

  // Request Access Modal for Future Notes
  const [requestAccessNote, setRequestAccessNote] = useState<IFutureNoteItem | null>(null);
  const [accessReason, setAccessReason] = useState("");

  const selected = requests.find((r) => r._id === selectedId) || null;

  // Filtered requests
  const filtered = requests.filter((r) => {
    if (tab === "pending") return ["pending", "in_review"].includes(r.status);
    if (tab === "resolved")
      return ["approved", "rejected", "completed", "cancelled"].includes(r.status);
    return true;
  });

  // ─── Actions ─────────────────────────────────────────────
  function handleSelectRequest(req: ILifeRequest) {
    setSelectedId(req._id);
    setMsgText("");
    setMsgError("");
    startTransition(async () => {
      await markRequestMessagesAsRead(req._id);
      router.refresh();
    });
  }

  function handleSubmitNew() {
    if (!newTitle.trim() || !newDesc.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setFormError("");
    startTransition(async () => {
      const result = await createRequest({
        category: newCategory,
        title: newTitle.trim(),
        description: newDesc.trim(),
      });
      if (result.success) {
        setFormSuccess("Request submitted successfully!");
        setNewTitle("");
        setNewDesc("");
        setNewCategory("general_inquiry");
        setTimeout(() => {
          setShowNewForm(false);
          setFormSuccess("");
          router.refresh();
        }, 1200);
      } else {
        setFormError(result.error || "Failed to submit request.");
      }
    });
  }

  function handleSendMessage() {
    if (!msgText.trim() || !selectedId) return;
    setMsgError("");
    startTransition(async () => {
      const result = await sendRequestMessage(selectedId, msgText.trim());
      if (result.success) {
        setMsgText("");
        router.refresh();
      } else {
        setMsgError(result.error || "Failed to send message.");
      }
    });
  }

  function handleUpdateStatus() {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await updateRequestStatus(selectedId, newStatus, adminResponse);
      if (result.success) {
        toast.success(`Request ${newStatus}!`);
        setAdminResponse("");
        router.refresh();
      }
    });
  }

  function handleCancel() {
    if (!selectedId) return;
    startTransition(async () => {
      await cancelRequest(selectedId);
      router.refresh();
    });
  }

  function handleSubmitRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!requestAccessNote) return;
    startTransition(async () => {
      try {
        const res = await requestFutureNoteAccess(
          requestAccessNote.noteId,
          accessReason.trim()
        );
        if (res.success) {
          toast.success(
            "Access requested! The Owner has been notified and the waiting period has begun."
          );
          setFutureNotes((prev) =>
            prev.map((fn) =>
              fn.noteId === requestAccessNote.noteId
                ? {
                    ...fn,
                    status: "countdown_active",
                    hasAccessRequested: true,
                    unlockRequestedAt: new Date(),
                    unlockDeadline: new Date(
                      Date.now() + (fn.waitingPeriodHours || 48) * 3600 * 1000
                    ),
                  }
                : fn
            )
          );
          setRequestAccessNote(null);
          setAccessReason("");
          router.refresh();
        } else {
          toast.error("Failed to request access");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to request access");
      }
    });
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <ClipboardList className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight truncate">
                {isAdmin ? "Requests Inbox" : "Request Center"}
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {isAdmin
                  ? "Review and respond to all incoming requests and note access inquiries"
                  : "Submit requests, request future note access, and communicate with the admin"}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <Button
              size="sm"
              className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold gap-1.5 shrink-0"
              onClick={() => {
                setShowNewForm(true);
                setSelectedId(null);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Request
            </Button>
          )}
        </div>

        {/* Tab filter */}
        <div className="inline-flex p-1 rounded-xl bg-secondary/80 border border-border text-xs font-semibold flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setTab("messages")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              tab === "messages"
                ? "bg-background text-foreground shadow-xs font-bold text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Direct Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs">
                {unreadMessagesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 py-1 rounded-lg transition-all ${
              tab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`px-3 py-1 rounded-lg transition-all ${
              tab === "pending"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({requests.filter((r) => ["pending", "in_review"].includes(r.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setTab("future_notes")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              tab === "future_notes"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-3 h-3 text-violet-500" />
            <span>Future Notes</span>
            {futureNotes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400">
                {futureNotes.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("resolved")}
            className={`px-3 py-1 rounded-lg transition-all ${
              tab === "resolved"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resolved
          </button>
        </div>

        {/* ── Direct Messages Tab View ── */}
        {tab === "messages" ? (
          <ConversationClient
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            initialUserConversation={initialUserConversation}
            initialAdminConversations={initialAdminConversations}
            initialSelectedUserEmail={initialSelectedUserEmail}
          />
        ) : tab === "future_notes" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-sm font-bold text-foreground">
                    Future & Protected Notes
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Directives and continuity instructions assigned to you for future viewing.
                  Request access when ready.
                </p>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40 shrink-0">
                Content remains strictly protected until released by Owner or waiting period expiry.
              </div>
            </div>

            {futureNotes.length === 0 ? (
              <div className="p-12 rounded-3xl border border-dashed border-border bg-card/40 text-center">
                <Lock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-foreground">
                  No Future Notes Assigned
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  When the Owner assigns notes or directives for future viewing, they will appear
                  here with access request controls.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {futureNotes.map((fn) => {
                  const isWaitingApproval =
                    fn.status === "countdown_active" ||
                    fn.status === "unlock_requested" ||
                    fn.hasAccessRequested;
                  const isRejected = fn.status === "request_rejected";

                  return (
                    <div
                      key={fn.noteId}
                      className="p-4 rounded-2xl bg-card border border-border hover:border-border/90 flex flex-col justify-between transition-all space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            <Lock className="w-2.5 h-2.5" />
                            Future Note
                          </span>

                          {isWaitingApproval ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-2.5 h-2.5 animate-spin" />
                              Waiting for Approval
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <XCircle className="w-2.5 h-2.5" />
                              Request Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                              Assigned
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-foreground leading-snug">
                            {fn.title}
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Assigned to you · {fn.waitingPeriodHours}h waiting period
                          </p>
                        </div>

                        {/* Limited Metadata Notice - Content Protected */}
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground">
                          {isWaitingApproval ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Waiting period active ({fn.waitingPeriodHours}h)</span>
                              </p>
                              {fn.unlockDeadline && (
                                <p className="text-[10px]">
                                  Deadline: {new Date(fn.unlockDeadline).toLocaleString()}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                Will automatically release to your Notes section when period expires if
                                no owner action is taken.
                              </p>
                            </div>
                          ) : isRejected ? (
                            <p className="text-rose-600 dark:text-rose-400 text-[10px]">
                              Access was rejected by the Owner. This note remains protected.
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">
                              Content is protected. Click &quot;Request Access&quot; to notify the
                              Owner and start the {fn.waitingPeriodHours}h countdown.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/40">
                        {isWaitingApproval ? (
                          <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 py-1">
                            Waiting for Approval
                          </div>
                        ) : isRejected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRequestAccessNote(fn);
                              setAccessReason("");
                            }}
                            className="w-full h-8 rounded-xl text-xs font-semibold border-border gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Request Access Again</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setRequestAccessNote(fn);
                              setAccessReason("");
                            }}
                            className="w-full h-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Request Access</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Standard Requests View ── */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Left: Request List */}
            <div className="md:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-0.5">
              {showNewForm && (
                <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">New Request</span>
                    <button
                      onClick={() => setShowNewForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as RequestCategory)}
                      className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Request title *"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <textarea
                      placeholder="Describe your request in detail *"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={3}
                      className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {formError && <p className="text-[11px] text-rose-600">{formError}</p>}
                  {formSuccess && <p className="text-[11px] text-emerald-600">{formSuccess}</p>}

                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={handleSubmitNew}
                    className="w-full h-8 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold gap-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Submit Request
                  </Button>
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="p-6 rounded-2xl bg-card border border-border text-center">
                  <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground">No requests found</p>
                  {!isAdmin && (
                    <button
                      onClick={() => setShowNewForm(true)}
                      className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Submit your first request →
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((req) => {
                  const isActive = selectedId === req._id;
                  const hasUnread = isAdmin ? req.unreadByAdmin > 0 : req.unreadByUser > 0;
                  return (
                    <button
                      key={req._id}
                      type="button"
                      onClick={() => handleSelectRequest(req)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-emerald-500/5 border-emerald-500/30 shadow-xs"
                          : "bg-card border-border hover:border-emerald-500/20 hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {hasUnread && (
                              <span className="flex h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                            )}
                            <p className="text-xs font-bold text-foreground truncate">
                              {req.title}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {CATEGORY_LABELS[req.category]} · {formatTime(req.createdAt)}
                          </p>
                          {isAdmin && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              From: {req.submittedByName}
                            </p>
                          )}
                          {req.relatedRecordName && (
                            <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-0.5 truncate">
                              Ref: {req.relatedRecordName}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge status={req.status} />
                          {req.messages.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MessageCircle className="w-3 h-3" />
                              {req.messages.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: Detail / Thread */}
            <div className="md:col-span-2">
              {!selected ? (
                <div className="p-8 rounded-3xl bg-card border border-border text-center h-full min-h-[200px] flex flex-col items-center justify-center gap-3">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Select a request to view the conversation thread
                  </p>
                  {!isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowNewForm(true)}
                      className="mt-1 h-8 rounded-xl text-xs gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Request
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden flex flex-col"
                  style={{ maxHeight: "75vh" }}
                >
                  {/* Thread header */}
                  <div className="p-4 border-b border-border bg-card flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={selected.status} />
                          <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-secondary border border-border">
                            {CATEGORY_LABELS[selected.category]}
                          </span>
                          {selected.relatedRecordName && (
                            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                              Ref: {selected.relatedRecordName}
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-black text-foreground mt-1">{selected.title}</h2>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {isAdmin
                            ? `From: ${selected.submittedByName} (${selected.submittedByEmail})`
                            : `Submitted ${formatTime(selected.createdAt)}`}
                        </p>
                      </div>

                      {/* Admin action: update status */}
                      {isAdmin && ["pending", "in_review"].includes(selected.status) && (
                        <details className="relative shrink-0">
                          <summary className="list-none cursor-pointer">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary border border-border text-xs font-semibold hover:bg-accent transition-colors">
                              Update Status <ChevronDown className="w-3 h-3" />
                            </span>
                          </summary>
                          <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-2xl shadow-xl p-3 space-y-2 w-56">
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                              className="w-full text-xs border border-border rounded-xl px-2 py-1.5 bg-background text-foreground"
                            >
                              <option value="in_review">In Review</option>
                              <option value="approved">Approved & Release</option>
                              <option value="rejected">Reject</option>
                              <option value="completed">Completed</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Admin note / response (optional)"
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              className="w-full text-xs border border-border rounded-xl px-2 py-1.5 bg-background text-foreground placeholder:text-muted-foreground"
                            />
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={handleUpdateStatus}
                              className="w-full h-7 rounded-xl text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                            >
                              Save Status
                            </Button>
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Original description */}
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-xs text-foreground mt-1">
                      {selected.description}
                    </div>

                    {/* Admin Response banner if resolved */}
                    {selected.adminResponse && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold">Admin response: </span>
                        {selected.adminResponse}
                      </div>
                    )}
                  </div>

                  {/* Messages scroll area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
                    {selected.messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No messages in this thread yet. Send a message below.
                      </p>
                    ) : (
                      selected.messages.map((m: any, idx: number) => {
                        const isMe = m.senderId === currentUserId;
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-foreground">
                                {m.senderName}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {formatTime(m.createdAt)}
                              </span>
                            </div>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                isMe
                                  ? "bg-emerald-700 text-white rounded-tr-xs"
                                  : "bg-secondary text-foreground border border-border rounded-tl-xs"
                              }`}
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  {!["approved", "rejected", "completed", "cancelled"].includes(
                    selected.status
                  ) && (
                    <div className="p-3 border-t border-border bg-card flex items-center gap-2">
                      <input
                        type="text"
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && handleSendMessage()
                        }
                        placeholder="Type a message…"
                        className="flex-1 text-xs border border-border rounded-xl px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <Button
                        size="sm"
                        disabled={isPending || !msgText.trim()}
                        onClick={handleSendMessage}
                        className="h-9 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shrink-0"
                      >
                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Cancel request (non-admin, pending/in_review) */}
                  {!isAdmin && ["pending", "in_review"].includes(selected.status) && (
                    <div className="px-4 pb-3">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isPending}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Cancel this request
                      </button>
                    </div>
                  )}

                  {msgError && (
                    <p className="text-[11px] text-rose-600 px-4 pb-2">{msgError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Request Access Confirmation Dialog ── */}
      <Dialog
        open={Boolean(requestAccessNote)}
        onOpenChange={() => setRequestAccessNote(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-violet-600" />
              <span>Request Access to Note</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {requestAccessNote?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRequestAccess} className="space-y-3 pt-2">
            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-foreground space-y-1">
              <p className="font-semibold text-violet-700 dark:text-violet-300">
                Waiting Period: {requestAccessNote?.waitingPeriodHours} Hours
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                When you submit this request, the Owner will be notified immediately. If no action is
                taken before the {requestAccessNote?.waitingPeriodHours}h waiting period expires, this
                note will automatically be released into your Notes section.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Note / Reason (Optional)</Label>
              <Textarea
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                placeholder="Optional note for the Owner explaining why you are requesting access now..."
                className="mt-1 min-h-[80px] rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRequestAccessNote(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>Submit Access Request</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
