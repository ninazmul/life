/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import {
  ClipboardList,
  MessageCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Inbox,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ILifeRequest, RequestCategory, RequestStatus } from "@/types";
import {
  createRequest,
  sendRequestMessage,
  markRequestMessagesAsRead,
  updateRequestStatus,
  cancelRequest,
} from "@/lib/actions/lifeRequest.actions";
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
  isAdmin: boolean;
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserRole: string;
  currentPersonId?: string;
}

// ─── Main Component ─────────────────────────────────────────
export function RequestCenterClient({
  initialRequests,
  isAdmin,
  currentUserId,
  currentUserEmail,
  currentUserName,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [requests, setRequests] = useState<ILifeRequest[]>(initialRequests);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending" | "resolved">("all");
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

  const selected = requests.find((r) => r._id === selectedId) || null;

  // Filtered
  const filtered = requests.filter((r) => {
    if (tab === "pending") return ["pending", "in_review"].includes(r.status);
    if (tab === "resolved") return ["approved", "rejected", "completed", "cancelled"].includes(r.status);
    return true;
  });

  // ─── Actions ─────────────────────────────────────────────
  function handleSelectRequest(req: ILifeRequest) {
    setSelectedId(req._id);
    setMsgText("");
    setMsgError("");
    // Mark as read
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
                  ? "Review and respond to all incoming requests"
                  : "Submit requests and communicate with the admin"}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <Button
              size="sm"
              className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold gap-1.5 shrink-0"
              onClick={() => { setShowNewForm(true); setSelectedId(null); }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Request
            </Button>
          )}
        </div>

        {/* Tab filter */}
        <div className="inline-flex p-1 rounded-xl bg-secondary/80 border border-border text-xs font-semibold">
          {(["all", "pending", "resolved"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg transition-all capitalize ${tab === t
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t === "all" ? `All (${requests.length})` : t === "pending" ? `Active` : `Resolved`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* ── Left: Request List ── */}
          <div className="md:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-0.5">
            {/* New Request Form (inline, non-admin only) */}
            {showNewForm && (
              <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">New Request</span>
                  <button onClick={() => setShowNewForm(false)} className="text-muted-foreground hover:text-foreground">
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
                      <option key={k} value={k}>{v}</option>
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
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${isActive
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

          {/* ── Right: Detail / Thread ── */}
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
              <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden flex flex-col" style={{ maxHeight: "75vh" }}>
                {/* Thread header */}
                <div className="p-4 border-b border-border bg-card flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={selected.status} />
                        <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-secondary border border-border">
                          {CATEGORY_LABELS[selected.category]}
                        </span>
                      </div>
                      <h2 className="text-sm font-black text-foreground mt-1">{selected.title}</h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isAdmin ? `From: ${selected.submittedByName} (${selected.submittedByEmail})` : `Submitted ${formatTime(selected.createdAt)}`}
                      </p>
                    </div>
                    {/* Admin actions */}
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
                            {(["in_review", "approved", "rejected", "completed"] as RequestStatus[]).map((s) => (
                              <option key={s} value={s}>{STATUS_META[s].label}</option>
                            ))}
                          </select>
                          <textarea
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            placeholder="Response (optional)"
                            rows={2}
                            className="w-full text-xs border border-border rounded-xl px-2 py-1.5 bg-background resize-none"
                          />
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={handleUpdateStatus}
                            className="w-full h-7 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                          >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
                          </Button>
                        </div>
                      </details>
                    )}
                  </div>
                  {/* Original request description */}
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Original Request</p>
                    <p className="text-xs text-foreground leading-relaxed">{selected.description}</p>
                  </div>
                  {selected.adminResponse && (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1 uppercase tracking-wider">Admin Response</p>
                      <p className="text-xs text-foreground leading-relaxed">{selected.adminResponse}</p>
                    </div>
                  )}
                </div>

                {/* Messages thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selected.messages.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageCircle className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No messages yet. Start the conversation.</p>
                    </div>
                  ) : (
                    selected.messages.map((msg, idx) => {
                      const isMe = msg.senderId === currentUserId;
                      return (
                        <div key={idx} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[80%] ${isMe
                            ? "bg-emerald-700 text-white"
                            : "bg-secondary text-foreground border border-border"
                            }`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-muted-foreground px-1">
                            {msg.senderName} · {formatTime(msg.createdAt)}
                            {!msg.isRead && !isMe && (
                              <span className="ml-1 text-rose-500">● unread</span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message input */}
                {["pending", "in_review", "approved"].includes(selected.status) && (
                  <div className="p-3 border-t border-border bg-card/80 flex gap-2">
                    <input
                      type="text"
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message…"
                      className="flex-1 text-xs border border-border rounded-xl px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <Button
                      size="sm"
                      disabled={isPending || !msgText.trim()}
                      onClick={handleSendMessage}
                      className="h-9 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shrink-0"
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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

                {msgError && <p className="text-[11px] text-rose-600 px-4 pb-2">{msgError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
