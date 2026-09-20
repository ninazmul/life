"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  NotebookPen,
  Plus,
  Search,
  Pin,
  Lock,
  Eye,
  Calendar,
  AlertTriangle,
  History,
  Archive,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  ExternalLink,
  ChevronRight,
  Filter,
  Tag,
  KeyRound,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createNote,
  updateNote,
  archiveNote,
  requestNoteUnlock,
  approveNoteUnlock,
  rejectNoteUnlock,
  cancelNoteUnlock,
  extendNoteUnlock,
  relockNote,
} from "@/lib/actions/lifeNote.actions";
import { ILifeNote, ILifePerson, NoteType, NoteStatus } from "@/types";

interface LifeNoteClientProps {
  initialNotes: ILifeNote[];
  people: ILifePerson[];
  isOwner: boolean;
  isAdmin: boolean;
  currentPersonId?: string;
}

export function LifeNoteClient({
  initialNotes = [],
  people = [],
  isOwner = false,
  isAdmin = false,
  currentPersonId,
}: LifeNoteClientProps) {
  const [notes, setNotes] = useState<ILifeNote[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ILifeNote | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    noteType: "always_visible" as NoteType,
    assignedPersonId: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    category: "",
    tags: "",
    isPinned: false,
    waitingPeriodHours: 48,
  });

  // Action Modals state
  const [unlockModalNote, setUnlockModalNote] = useState<ILifeNote | null>(null);
  const [relockModalNote, setRelockModalNote] = useState<ILifeNote | null>(null);
  const [relockPin, setRelockPin] = useState("");
  const [historyModalNote, setHistoryModalNote] = useState<ILifeNote | null>(null);
  const [rejectModalNote, setRejectModalNote] = useState<ILifeNote | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const canManage = isOwner || isAdmin;

  // Open modal for new note
  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormData({
      title: "",
      content: "",
      noteType: "always_visible",
      assignedPersonId: currentPersonId || (people[0]?._id ? String(people[0]._id) : ""),
      priority: "medium",
      category: "",
      tags: "",
      isPinned: false,
      waitingPeriodHours: 48,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing note
  const handleOpenEdit = (note: ILifeNote) => {
    setEditingNote(note);
    const assignedId = typeof note.assignedPersonId === "object"
      ? (note.assignedPersonId as any)?._id
      : note.assignedPersonId;

    setFormData({
      title: note.title,
      content: note.content,
      noteType: note.noteType,
      assignedPersonId: String(assignedId || ""),
      priority: note.priority || "medium",
      category: note.category || "",
      tags: (note.tags || []).join(", "),
      isPinned: Boolean(note.isPinned),
      waitingPeriodHours: note.waitingPeriodHours || 48,
    });
    setIsModalOpen(true);
  };

  // Submit note (create or update)
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a note title");
      return;
    }
    if (!formData.assignedPersonId) {
      toast.error("Please select an assigned person");
      return;
    }

    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        if (editingNote) {
          const updated = await updateNote(editingNote._id, {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            category: formData.category,
            tags: tagsArray,
            isPinned: formData.isPinned,
            waitingPeriodHours: Number(formData.waitingPeriodHours),
          });
          setNotes((prev) =>
            prev.map((n) => (n._id === editingNote._id ? { ...n, ...updated } : n))
          );
          toast.success("Note updated successfully");
        } else {
          const created = await createNote({
            title: formData.title,
            content: formData.content,
            noteType: formData.noteType,
            assignedPersonId: formData.assignedPersonId,
            priority: formData.priority,
            category: formData.category,
            tags: tagsArray,
            isPinned: formData.isPinned,
            waitingPeriodHours: Number(formData.waitingPeriodHours),
          });
          setNotes((prev) => [created, ...prev]);
          toast.success("Note created successfully");
        }
        setIsModalOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Failed to save note");
      }
    });
  };

  // Archive note
  const handleArchive = async (noteId: string) => {
    if (!confirm("Are you sure you want to archive this note?")) return;
    startTransition(async () => {
      try {
        await archiveNote(noteId);
        setNotes((prev) => prev.filter((n) => n._id !== noteId));
        toast.success("Note archived");
      } catch (err: any) {
        toast.error(err.message || "Failed to archive note");
      }
    });
  };

  // Toggle Pin
  const handleTogglePin = async (note: ILifeNote) => {
    startTransition(async () => {
      try {
        const updated = await updateNote(note._id, {
          isPinned: !note.isPinned,
        });
        setNotes((prev) =>
          prev.map((n) => (n._id === note._id ? { ...n, isPinned: !note.isPinned } : n))
        );
        toast.success(note.isPinned ? "Note unpinned" : "Note pinned to top");
      } catch (err: any) {
        toast.error(err.message || "Failed to update pin state");
      }
    });
  };

  // Secret note emergency unlock requests
  const handleRequestUnlock = async (note: ILifeNote) => {
    startTransition(async () => {
      try {
        const updated = await requestNoteUnlock(note._id);
        setNotes((prev) => prev.map((n) => (n._id === note._id ? updated : n)));
        toast.success("Emergency unlock initiated. Waiting period countdown started.");
        setUnlockModalNote(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to request unlock");
      }
    });
  };

  const handleApproveUnlock = async (noteId: string) => {
    startTransition(async () => {
      try {
        const updated = await approveNoteUnlock(noteId);
        setNotes((prev) => prev.map((n) => (n._id === noteId ? updated : n)));
        toast.success("Note unlocked and released immediately");
      } catch (err: any) {
        toast.error(err.message || "Failed to approve unlock");
      }
    });
  };

  const handleRejectUnlock = async () => {
    if (!rejectModalNote) return;
    startTransition(async () => {
      try {
        const updated = await rejectNoteUnlock(rejectModalNote._id, rejectReason);
        setNotes((prev) => prev.map((n) => (n._id === rejectModalNote._id ? updated : n)));
        toast.success("Unlock request rejected");
        setRejectModalNote(null);
        setRejectReason("");
      } catch (err: any) {
        toast.error(err.message || "Failed to reject unlock");
      }
    });
  };

  const handleCancelUnlock = async (noteId: string) => {
    startTransition(async () => {
      try {
        const updated = await cancelNoteUnlock(noteId);
        setNotes((prev) => prev.map((n) => (n._id === noteId ? updated : n)));
        toast.success("Unlock request cancelled");
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel unlock");
      }
    });
  };

  const handleRelock = async () => {
    if (!relockModalNote) return;
    startTransition(async () => {
      try {
        const updated = await relockNote(relockModalNote._id, relockPin);
        setNotes((prev) => prev.map((n) => (n._id === relockModalNote._id ? updated : n)));
        toast.success("Note locked successfully");
        setRelockModalNote(null);
        setRelockPin("");
      } catch (err: any) {
        toast.error(err.message || "Failed to lock note");
      }
    });
  };

  // Filter and search
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = (n.content || "").toLowerCase().includes(q);
        const matchCategory = (n.category || "").toLowerCase().includes(q);
        const matchTags = (n.tags || []).some((t) => t.toLowerCase().includes(q));
        const personName =
          typeof n.assignedPersonId === "object"
            ? (n.assignedPersonId as any)?.name || ""
            : "";
        const matchPerson = personName.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCategory && !matchTags && !matchPerson) {
          return false;
        }
      }

      // Type filter
      if (typeFilter === "pinned") {
        if (!n.isPinned) return false;
      } else if (typeFilter !== "all") {
        if (n.noteType !== typeFilter) return false;
      }

      // Person filter
      if (personFilter !== "all") {
        const pId =
          typeof n.assignedPersonId === "object"
            ? (n.assignedPersonId as any)?._id
            : n.assignedPersonId;
        if (String(pId) !== personFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== "all") {
        if (n.priority !== priorityFilter) return false;
      }

      return true;
    });
  }, [notes, search, typeFilter, personFilter, priorityFilter]);

  // Quick stats
  const totalCount = notes.length;
  const pinnedCount = notes.filter((n) => n.isPinned).length;
  const secretCount = notes.filter((n) => n.noteType === "secret_emergency").length;
  const releasedCount = notes.filter((n) => n.isReleased).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <NotebookPen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                LifeNote
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                Directives & Continuity
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Confidential personal notes, designated person directives, and secret emergency unlock files.
            </p>
          </div>
        </div>

        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium gap-2 shadow-md shadow-violet-600/20 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create LifeNote</span>
          </Button>
        )}
      </div>

      {/* ── Quick Stats Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground leading-none">{totalCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Total Notes</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Pin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground leading-none">{pinnedCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Pinned Notes</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground leading-none">{secretCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Secret Emergency</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground leading-none">{releasedCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Released & Active</div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card/50">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title, content, tag, or assigned person..."
            className="pl-9 h-9 rounded-xl text-xs bg-background/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Person Filter */}
          <Select value={personFilter} onValueChange={setPersonFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl min-w-[140px] bg-background/50">
              <SelectValue placeholder="Filter Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {people.map((p) => (
                <SelectItem key={p._id} value={String(p._id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl min-w-[130px] bg-background/50">
              <SelectValue placeholder="Note Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pinned">📌 Pinned</SelectItem>
              <SelectItem value="always_visible">Always Visible</SelectItem>
              <SelectItem value="secret_emergency">🔒 Secret Emergency</SelectItem>
              <SelectItem value="manual_release">Manual Release</SelectItem>
              <SelectItem value="scheduled_release">Scheduled</SelectItem>
              {canManage && <SelectItem value="internal_admin">Admin Internal</SelectItem>}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl min-w-[110px] bg-background/50">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Notes Grid ── */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-border bg-card/40">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-3">
            <NotebookPen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No notes found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || typeFilter !== "all" || personFilter !== "all"
              ? "No notes matched your current search filters. Try resetting them."
              : "Create personal directives, continuity notes, and secret emergency instructions."}
          </p>
          {canManage && (
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs font-semibold gap-1.5 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Note
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isSecret = note.noteType === "secret_emergency";
            const isLocked = isSecret && !note.isReleased && note.status !== "approved";
            const isCountdown =
              note.status === "unlock_requested" || note.status === "countdown_active";

            const assignedPerson =
              typeof note.assignedPersonId === "object"
                ? (note.assignedPersonId as any)
                : people.find((p) => String(p._id) === String(note.assignedPersonId));

            return (
              <div
                key={note._id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between group ${
                  note.isPinned
                    ? "bg-card border-violet-500/40 shadow-sm"
                    : "bg-card border-border hover:border-border/80"
                }`}
              >
                <div>
                  {/* Top Tags & Type Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {note.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                          isSecret
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                        }`}
                      >
                        {isSecret ? <Lock className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                        {note.noteType.replace("_", " ")}
                      </span>

                      {note.priority && note.priority !== "medium" && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            note.priority === "critical"
                              ? "bg-red-500/10 text-red-600 border border-red-500/20"
                              : note.priority === "high"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {note.priority}
                        </span>
                      )}
                    </div>

                    {note.category && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate max-w-[110px]">
                        {note.category}
                      </span>
                    )}
                  </div>

                  {/* Note Title */}
                  <h3 className="text-sm font-bold text-foreground mb-1 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {note.title}
                  </h3>

                  {/* Content Preview */}
                  <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/40 font-mono text-[11px]">
                    {note.content}
                  </div>

                  {/* Secret Emergency Countdown Alert */}
                  {isSecret && isCountdown && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" />
                        <span className="text-[11px] font-medium truncate">
                          Unlock in progress ({note.waitingPeriodHours}h waiting period)
                        </span>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleApproveUnlock(note._id)}
                            className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModalNote(note)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assigned Person Meta */}
                  {assignedPerson && (
                    <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {assignedPerson.name?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
                      </div>
                      <span className="font-medium text-foreground truncate">
                        {assignedPerson.name}
                      </span>
                      {assignedPerson.relation && (
                        <span className="text-[10px] text-muted-foreground">
                          • {assignedPerson.relation}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Secret Unlock Request Button */}
                    {isLocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestUnlock(note)}
                        className="h-7 px-2.5 rounded-lg text-xs font-semibold text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Request Unlock</span>
                      </Button>
                    )}

                    {/* Admin Relock Button */}
                    {isSecret && (note.isReleased || note.status === "released") && canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRelockModalNote(note)}
                        className="h-7 px-2 rounded-lg text-[11px] font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Relock</span>
                      </Button>
                    )}

                    {/* History */}
                    {note.history && note.history.length > 0 && (
                      <button
                        onClick={() => setHistoryModalNote(note)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        title="View audit history"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isPinned
                            ? "text-amber-500 bg-amber-500/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title={note.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(note._id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Archive note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Note Dialog ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-violet-600" />
              <span>{editingNote ? "Edit LifeNote" : "Create New LifeNote"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Directives, continuity instructions, and confidential secret files assigned to a designated person.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitNote} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold">Note Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Master Vault Access Protocol & Primary Lawyer"
                className="mt-1 h-9 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Assigned Person *</Label>
                <Select
                  value={formData.assignedPersonId}
                  onValueChange={(val) => setFormData({ ...formData, assignedPersonId: val })}
                >
                  <SelectTrigger className="mt-1 h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Select Person" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p._id} value={String(p._id)}>
                        {p.name} ({p.relation || "Contact"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Note Type</Label>
                <Select
                  value={formData.noteType}
                  onValueChange={(val: NoteType) => setFormData({ ...formData, noteType: val })}
                  disabled={Boolean(editingNote)}
                >
                  <SelectTrigger className="mt-1 h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always_visible">Always Visible</SelectItem>
                    <SelectItem value="secret_emergency">🔒 Secret Emergency</SelectItem>
                    <SelectItem value="manual_release">Manual Release</SelectItem>
                    <SelectItem value="scheduled_release">Scheduled</SelectItem>
                    {canManage && <SelectItem value="internal_admin">Admin Internal</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Secret Emergency Delay Settings */}
            {formData.noteType === "secret_emergency" && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Emergency Waiting Period Countdown</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When requested, the recipient will trigger a waiting period before the content is unveiled. Admins can cancel or veto during this window.
                </p>
                <div>
                  <Label className="text-[11px]">Waiting Period (Hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={formData.waitingPeriodHours}
                    onChange={(e) =>
                      setFormData({ ...formData, waitingPeriodHours: Number(e.target.value) })
                    }
                    className="mt-1 h-8 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Note Content *</Label>
              <Textarea
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write confidential instructions, access directives, or critical notes..."
                className="mt-1 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="mt-1 h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Legal, Finance, Property"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. will, backup, lawyer"
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="isPinned" className="text-xs cursor-pointer">
                Pin this note to the top of the LifeNote dashboard
              </Label>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl text-xs h-9 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {editingNote ? "Save Changes" : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Relock Modal ── */}
      <Dialog open={Boolean(relockModalNote)} onOpenChange={() => setRelockModalNote(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>Relock Secret Note</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Conceal the contents of "{relockModalNote?.title}". The note will require another emergency unlock cycle to be viewed again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold">Master Security PIN (Optional)</Label>
              <Input
                type="password"
                value={relockPin}
                onChange={(e) => setRelockPin(e.target.value)}
                placeholder="Enter 6-digit security PIN if configured"
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRelockModalNote(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRelock}
              disabled={isPending}
              className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Relock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Audit Modal ── */}
      <Dialog open={Boolean(historyModalNote)} onOpenChange={() => setHistoryModalNote(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-violet-500" />
              <span>Audit & Revision History</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detailed access logs and revision events for "{historyModalNote?.title}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            {historyModalNote?.history && historyModalNote.history.length > 0 ? (
              historyModalNote.history.map((h, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl border border-border/60 bg-muted/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span className="font-semibold text-foreground uppercase">{h.action}</span>
                    <span>{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground text-[11px]">By: {h.changedBy}</div>
                  {h.newContent && (
                    <div className="mt-1 font-mono text-[10px] bg-background/50 p-2 rounded-lg truncate">
                      {h.newContent}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No history entries recorded yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject Reason Modal ── */}
      <Dialog open={Boolean(rejectModalNote)} onOpenChange={() => setRejectModalNote(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Reject Unlock Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide an optional reason for vetoing the emergency unlock of "{rejectModalNote?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Label className="text-xs font-semibold">Reason (Optional)</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Accidental trigger, owner confirmed safe"
              className="mt-1 h-9 rounded-xl text-xs"
            />
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalNote(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRejectUnlock}
              disabled={isPending}
              className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Veto / Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
