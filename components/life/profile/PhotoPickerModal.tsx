"use client";

import { useState, useRef } from "react";
import { Upload, Trash2, Camera, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface PhotoPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  userName: string;
  onPhotoSelected: (base64Url: string) => void;
  onPhotoRemoved: () => void;
}

export function PhotoPickerModal({
  open,
  onOpenChange,
  currentAvatarUrl,
  userName,
  onPhotoSelected,
  onPhotoRemoved,
}: PhotoPickerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentAvatarUrl || "");

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SI";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be less than 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onPhotoSelected(result);
      toast.success("Photo updated!");
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview("");
    onPhotoRemoved();
    toast.success("Photo removed");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 border-0 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-[#1E1B4B] dark:text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Profile Photo
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Upload a clear photo or remove your current photo.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-purple-100 dark:ring-purple-900/50 shadow-md bg-purple-600 flex items-center justify-center text-white text-3xl font-extrabold">
              {preview ? (
                <img src={preview} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">Supported formats: JPG, PNG, WEBP (Max 3MB)</p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              {preview ? "Change Photo" : "Upload Photo"}
            </button>

            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-full h-11 rounded-2xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Photo
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
