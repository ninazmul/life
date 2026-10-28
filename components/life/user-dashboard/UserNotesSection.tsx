/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  Paperclip,
  MessageSquare,
  AlertCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getUserNotes,
  markNoteAsRead,
  askQuestionAboutNote,
} from "@/lib/actions/lifeUserDashboard.actions";

interface Props {
  onBack: () => void;
  ownerName?: string;
}

export function UserNotesSection({ onBack, ownerName = "Owner" }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [question, setQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    const res = await getUserNotes();
    if (res.success && res.data) setNotes(res.data);
    setLoading(false);
  }

  async function handleMarkRead(noteId: string) {
    setMarkingRead(true);
    const res = await markNoteAsRead(noteId);
    if (res.success) {
      toast.success("Marked as read");
      setNotes((prev) =>
        prev.map((n) =>
          n._id === noteId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      if (selectedNote?._id === noteId) {
        setSelectedNote((prev: any) => ({ ...prev, isRead: true, readAt: new Date().toISOString() }));
      }
    } else {
      toast.error(res.error || "Failed to mark as read");
    }
    setMarkingRead(false);
  }

  async function handleAskQuestion() {
    if (!question.trim() || !selectedNote) return;
    setAskingQuestion(true);
    const res = await askQuestionAboutNote(selectedNote._id, question.trim());
    if (res.success) {
      toast.success("Question sent! Check My Requests for the reply.");
      setShowAskQuestion(false);
      setQuestion("");
    } else {
      toast.error(res.error || "Failed to send question");
    }
    setAskingQuestion(false);
  }

  function getNoteTypeLabel(type: string) {
    switch (type) {
      case "always_visible": return "Note";
      case "manual_release": return "Instruction";
      case "scheduled_release": return "Scheduled";
      case "secret_emergency": return "Secure Note";
      default: return "Note";
    }
  }

  function getNoteTypeColor(type: string) {
    switch (type) {
      case "always_visible": return "bg-indigo-50 text-indigo-600";
      case "manual_release": return "bg-amber-50 text-amber-600";
      case "scheduled_release": return "bg-teal-50 text-teal-600";
      case "secret_emergency": return "bg-rose-50 text-rose-600";
      default: return "bg-slate-50 text-slate-600";
    }
  }

  // ── Note Detail View ──
  if (selectedNote) {
    return (
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { setSelectedNote(null); setShowAskQuestion(false); }}
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold text-[#1E1B4B]">Note Details</h2>
          <div className="ml-auto">
            {selectedNote.isRead ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Read
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                New
              </span>
            )}
          </div>
        </div>

        {/* Note Content Card */}
        <div className="bg-white rounded-2xl border border-slate-100/90 p-4 space-y-3">
          {/* Type Icon & Title */}
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getNoteTypeColor(selectedNote.noteType)}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1E1B4B] leading-tight">{selectedNote.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500">Shared by {selectedNote.sharedBy}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(selectedNote.sharedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {selectedNote.isRead && selectedNote.readAt && (
                  <span className="text-[10px] text-slate-400">
                    • Read just now
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {selectedNote.content}
          </div>

          {/* Instructions */}
          {selectedNote.instructions && (
            <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
              <p className="text-[10px] font-bold text-indigo-600 mb-1">Instructions</p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedNote.instructions}
              </p>
            </div>
          )}

          {/* Attachments */}
          {selectedNote.attachments?.length > 0 && (
            <div className="space-y-1.5">
              {selectedNote.attachments.map((att: string, i: number) => {
                const filename = att.split("/").pop() || "attachment";
                return (
                  <a
                    key={i}
                    href={att}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 rounded-lg px-3 py-2 border border-indigo-100/50"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate">{filename}</span>
                    <span className="text-[10px] text-indigo-400 ml-auto">View ›</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Mark as Read Button */}
        {!selectedNote.isRead && (
          <button
            onClick={() => handleMarkRead(selectedNote._id)}
            disabled={markingRead}
            className="w-full h-11 rounded-xl bg-[#4F46E5] text-white text-sm font-bold mt-3 hover:bg-[#4338CA] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {markingRead ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Mark as Read
          </button>
        )}

        {/* Read Confirmation */}
        {selectedNote.isRead && (
          <div className="flex items-center gap-2 mt-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-emerald-700 font-medium">You have marked this note as read.</p>
          </div>
        )}

        {/* Ask a Question */}
        {!showAskQuestion ? (
          <button
            onClick={() => setShowAskQuestion(true)}
            className="w-full text-center text-xs text-[#4F46E5] font-bold mt-3 hover:underline flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask a Question
          </button>
        ) : (
          <div className="mt-3 bg-white rounded-2xl border border-slate-100/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#1E1B4B]">Ask a Question</h4>
              <button onClick={() => setShowAskQuestion(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">About: {selectedNote.title}</p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Write what you would like to understand..."
              maxLength={500}
              className="w-full h-24 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-800 placeholder:text-slate-400 p-3 resize-none focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{question.length}/500</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAskQuestion(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || askingQuestion}
                  className="h-9 px-4 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] disabled:opacity-60 flex items-center gap-1.5"
                >
                  {askingQuestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Send Question
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400 mt-3 mb-6">
          Reading does not accept a responsibility.
        </p>
      </div>
    );
  }

  // ── Notes List View ──
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-[#1E1B4B]">Notes & Instructions</h2>
          <p className="text-[10px] text-slate-500">Messages and guidance shared with you.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-[#1E1B4B] mb-0.5">No notes yet</p>
          <p className="text-[11px] text-slate-400">Notes shared with you will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <button
              key={note._id}
              onClick={() => setSelectedNote(note)}
              className="w-full bg-white rounded-xl border border-slate-100/90 p-3.5 flex items-center gap-3 hover:border-indigo-100 hover:shadow-sm transition-all text-left group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getNoteTypeColor(note.noteType)}`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#1E1B4B] truncate">{note.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${getNoteTypeColor(note.noteType)}`}>
                    {getNoteTypeLabel(note.noteType)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(note.sharedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!note.isRead ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">New</span>
                  </span>
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5]" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
