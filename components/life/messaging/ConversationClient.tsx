"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useTransition } from "react";
import {
  Send,
  Paperclip,
  CheckCheck,
  Check,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  Search,
  User,
  Shield,
  Clock,
  LifeBuoy,
  RefreshCw,
  Lock,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  ILifeConversation,
  IConversationListItem,
  IConversationMessage,
  IConversationAttachment,
} from "@/types";
import {
  getUserConversation,
  getAdminConversations,
  getConversationForAdmin,
  sendConversationMessage,
  markConversationAsRead,
} from "@/lib/actions/lifeConversation.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────
function formatMessageTime(dateString: any): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const timeStr = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return timeStr;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  }

  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ConversationClientProps {
  isAdmin: boolean;
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserRole: string;
  initialUserConversation?: ILifeConversation | null;
  initialAdminConversations?: IConversationListItem[];
  initialSelectedUserEmail?: string;
}

export function ConversationClient({
  isAdmin,
  currentUserId,
  currentUserEmail,
  currentUserName,
  currentUserRole,
  initialUserConversation,
  initialAdminConversations = [],
  initialSelectedUserEmail,
}: ConversationClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Admin conversation directory state
  const [conversations, setConversations] = useState<IConversationListItem[]>(
    initialAdminConversations
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(
    initialSelectedUserEmail ||
      (initialAdminConversations.length > 0
        ? initialAdminConversations[0].userEmail
        : null)
  );

  // Active conversation state (either user's own, or admin's selected user)
  const [activeConversation, setActiveConversation] =
    useState<ILifeConversation | null>(initialUserConversation || null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  // Message input state
  const [inputText, setInputText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    IConversationAttachment[]
  >([]);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [activeConversation?.messages?.length]);

  // Load conversation on mount or when admin switches selected user
  useEffect(() => {
    if (isAdmin) {
      if (!selectedUserEmail) {
        setActiveConversation(null);
        return;
      }
      setIsLoadingActive(true);
      getConversationForAdmin(selectedUserEmail)
        .then((conv) => {
          setActiveConversation(conv);
          if (conv && conv._id) {
            markConversationAsRead(conv._id).catch(console.error);
            // clear unread locally in list
            setConversations((prev) =>
              prev.map((item) =>
                item.userEmail.toLowerCase() === selectedUserEmail.toLowerCase()
                  ? { ...item, unreadCount: 0 }
                  : item
              )
            );
          }
        })
        .finally(() => setIsLoadingActive(false));
    } else {
      // Regular user: load their single isolated conversation
      getUserConversation().then((conv) => {
        setActiveConversation(conv);
        if (conv && conv._id) {
          markConversationAsRead(conv._id).catch(console.error);
        }
      });
    }
  }, [isAdmin, selectedUserEmail]);

  // Handle file uploads (converts to Base64 data URL with metadata)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 8 * 1024 * 1024; // 8MB limit
    const newAttachments: IConversationAttachment[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is larger than 8MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          setPendingAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              url,
              type: file.type || "application/octet-stream",
              size: file.size,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text && pendingAttachments.length === 0) return;

    setIsSending(true);
    try {
      const res = await sendConversationMessage({
        targetUserEmail: isAdmin ? selectedUserEmail || undefined : undefined,
        conversationId: activeConversation?._id,
        message: text,
        attachments: pendingAttachments,
      });

      if (res.success && res.conversation) {
        setActiveConversation(res.conversation);
        setInputText("");
        setPendingAttachments([]);
        scrollToBottom("smooth");

        // Update admin conversation list item snippet if admin
        if (isAdmin && selectedUserEmail) {
          setConversations((prev) =>
            prev.map((c) =>
              c.userEmail.toLowerCase() === selectedUserEmail.toLowerCase()
                ? {
                    ...c,
                    lastMessageText: text || "Sent an attachment",
                    lastMessageAt: new Date().toISOString(),
                    lastMessageSenderRole: currentUserRole,
                  }
                : c
            )
          );
        }
      } else {
        toast.error(res.error || "Failed to send message.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Refresh current conversation
  const handleRefresh = () => {
    startTransition(async () => {
      if (isAdmin && selectedUserEmail) {
        const [updatedConv, updatedList] = await Promise.all([
          getConversationForAdmin(selectedUserEmail),
          getAdminConversations(),
        ]);
        setActiveConversation(updatedConv);
        setConversations(updatedList);
      } else {
        const conv = await getUserConversation();
        setActiveConversation(conv);
      }
      toast.success("Messages updated");
    });
  };

  // Filter conversations for admin
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterUnreadOnly) {
      return matchesSearch && (c.unreadCount || 0) > 0;
    }
    return matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[780px] max-h-[82vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      {/* ────────────────────────────────────────────────────────── */}
      {/* LEFT COLUMN: SUPER ADMIN CONVERSATION DIRECTORY */}
      {/* (Only visible to Super Admin / Owners) */}
      {/* ────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 bg-zinc-50/60 dark:bg-zinc-900/40">
          {/* Header & Search */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    User Messages
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Individual 1-on-1 isolated threads
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                title="Refresh user list"
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user name or email..."
                className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(false)}
                className={`px-2.5 py-1 rounded-full font-medium transition ${
                  !filterUnreadOnly
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                All Users ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(true)}
                className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1 transition ${
                  filterUnreadOnly
                    ? "bg-rose-600 text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span>Unread</span>
                {conversations.filter((c) => (c.unreadCount || 0) > 0).length >
                  0 && (
                  <span className="px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                    {
                      conversations.filter((c) => (c.unreadCount || 0) > 0)
                        .length
                    }
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                No users found.
              </div>
            ) : (
              filteredConversations.map((item) => {
                const isSelected =
                  selectedUserEmail?.toLowerCase() ===
                  item.userEmail.toLowerCase();
                const unread = item.unreadCount || 0;

                return (
                  <button
                    key={item.userEmail}
                    onClick={() => setSelectedUserEmail(item.userEmail)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500"
                        : "hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border-l-4 border-transparent"
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      {item.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.avatarUrl}
                          alt={item.userName}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center border border-zinc-300 dark:border-zinc-700">
                          {item.userName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "U"}
                        </div>
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>

                    {/* Meta & Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected
                              ? "text-blue-900 dark:text-blue-200"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {item.userName}
                        </span>
                        {item.lastMessageAt && (
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {formatMessageTime(item.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-1">
                        {item.userEmail}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-[180px]">
                          {item.lastMessageText || "No messages yet"}
                        </span>
                        {item.userRole && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 font-medium capitalize">
                            {item.userRole.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* RIGHT PANE: INDIVIDUAL USER MESSAGE THREAD */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        {/* Chat Top Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/40 dark:bg-zinc-900/20">
          <div className="flex items-center gap-3 min-w-0">
            {isAdmin ? (
              activeConversation ? (
                <>
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                    {activeConversation.userName
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {activeConversation.userName}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium capitalize border border-blue-500/20">
                        {activeConversation.userRole?.replace(/_/g, " ") ||
                          "Individual"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {activeConversation.userEmail} ·{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Private thread
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-xs text-zinc-500">
                  Select a user conversation
                </div>
              )
            ) : (
              // Regular user header
              <>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Super Admin Support
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Channel
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    <span>Private & isolated direct communication</span>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              title="Refresh messages"
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* MESSAGES SCROLL AREA */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoadingActive ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Loading conversation...</span>
            </div>
          ) : !activeConversation ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
              <MessageCircle className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No user conversation selected
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Select a user from the left directory to inspect and respond to
                their private individual thread.
              </p>
            </div>
          ) : activeConversation.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Beginning of your private conversation
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                {isAdmin
                  ? `Send a message to ${activeConversation.userName}. Only you and this user will have access to this thread.`
                  : "Send a message or file to the Super Admin. Direct help requests from Notes will also appear here."}
              </p>
            </div>
          ) : (
            activeConversation.messages.map((msg: IConversationMessage, i) => {
              const isMine =
                msg.senderEmail.toLowerCase() ===
                currentUserEmail.toLowerCase();
              const isSuper =
                msg.senderRole === "super_admin" ||
                msg.senderRole === "owner" ||
                msg.senderRole === "admin";

              return (
                <div
                  key={msg._id || i}
                  className={`flex flex-col ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender Label */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {isMine ? "You" : msg.senderName}
                    </span>
                    {isSuper && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                        Admin
                      </span>
                    )}
                    <span>·</span>
                    <span>{formatMessageTime(msg.createdAt)}</span>
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-xs space-y-2.5 ${
                      isMine
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs border border-zinc-200/60 dark:border-zinc-700/60"
                    }`}
                  >
                    {/* Note Reference Card (if submitted from Need Help) */}
                    {msg.noteRef && (
                      <div
                        className={`rounded-xl p-2.5 text-xs border flex items-center justify-between gap-3 ${
                          isMine
                            ? "bg-blue-700/70 border-blue-500/50 text-white"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <LifeBuoy className="w-4 h-4 shrink-0 text-amber-500" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                              Referenced Note / Directive
                            </span>
                            <span className="font-semibold truncate block">
                              {msg.noteRef.noteTitle}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/lifenote?id=${msg.noteRef.noteId}`}
                          className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold underline hover:opacity-80 transition ${
                            isMine ? "text-blue-100" : "text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.message && (
                      <p className="text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed break-words">
                        {msg.message}
                      </p>
                    )}

                    {/* File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {msg.attachments.map((att, attIdx) => {
                          const isImg =
                            att.type?.startsWith("image/") ||
                            att.name.match(/\.(png|jpe?g|gif|webp|svg)$/i);

                          return (
                            <div key={attIdx} className="rounded-lg overflow-hidden">
                              {isImg ? (
                                <div className="space-y-1">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    className="max-h-60 rounded-lg object-cover w-full border border-black/10 dark:border-white/10"
                                  />
                                  <div className="flex items-center justify-between text-[10px] opacity-80 px-1">
                                    <span className="truncate">{att.name}</span>
                                    <a
                                      href={att.url}
                                      download={att.name}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 hover:underline font-semibold"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center justify-between p-2 rounded-lg border ${
                                    isMine
                                      ? "bg-blue-700/50 border-blue-500/40 text-white"
                                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 shrink-0 text-blue-400" />
                                    <div className="min-w-0">
                                      <span className="text-xs font-medium truncate block">
                                        {att.name}
                                      </span>
                                      {att.size && (
                                        <span className="text-[10px] opacity-75 block">
                                          {formatFileSize(att.size)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <a
                                    href={att.url}
                                    download={att.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition"
                                    title="Download attachment"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Read / Seen Receipt for sent messages */}
                  {isMine && (
                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-zinc-400">
                      {msg.isRead ? (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <CheckCheck className="w-3 h-3 stroke-[2.5]" />
                          <span>
                            Seen
                            {msg.readAt
                              ? ` · ${formatMessageTime(msg.readAt)}`
                              : ""}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Check className="w-3 h-3" />
                          <span>Sent</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* PENDING ATTACHMENT CHIPS */}
        {/* ──────────────────────────────────────────────────────── */}
        {pendingAttachments.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap gap-2">
            {pendingAttachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs"
              >
                {att.type?.startsWith("image/") ? (
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="max-w-[150px] truncate font-medium">
                  {att.name}
                </span>
                <span className="text-[10px] text-zinc-400">
                  ({formatFileSize(att.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removePendingAttachment(idx)}
                  className="p-0.5 hover:text-rose-500 transition ml-0.5"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* INPUT BAR */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeConversation && (
          <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-end gap-2">
              {/* Attachment Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files or screenshots"
                className="h-10 w-10 shrink-0 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Message Box */}
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={
                    isAdmin
                      ? `Message ${activeConversation.userName}... (Enter to send)`
                      : "Type your private message to Super Admin... (Enter to send)"
                  }
                  className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[40px] max-h-32 leading-relaxed"
                />
              </div>

              {/* Send Button */}
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  (!inputText.trim() && pendingAttachments.length === 0) ||
                  isSending
                }
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Send</span>
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Isolated private session</span>
              </span>
              <span>Press Shift + Enter for new line</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
