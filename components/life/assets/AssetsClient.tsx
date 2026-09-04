/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  DollarSign,
  Building,
  Car,
  Landmark,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ILifeAsset, AssetCategory, ILifePerson, ILifeBusiness } from "@/types";
import { createAsset, deleteAsset } from "@/lib/actions/lifeAsset.actions";
import toast from "react-hot-toast";

interface AssetsClientProps {
  initialAssets: ILifeAsset[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
}

export function AssetsClient({
  initialAssets,
  people,
  businesses,
}: AssetsClientProps) {
  const [assets, setAssets] = useState<ILifeAsset[]>(initialAssets);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("property");
  const [value, setValue] = useState("");
  const [ownershipPercentage, setOwnershipPercentage] = useState("100");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [relatedPersonId, setRelatedPersonId] = useState("none");
  const [relatedBusinessId, setRelatedBusinessId] = useState("none");

  const totalPortfolioValue = assets.reduce(
    (sum, a) => sum + (Number(a.value) || 0),
    0,
  );

  const filteredAssets = assets.filter((a) => {
    return categoryFilter === "all" || a.category === categoryFilter;
  });

  const categories = [
    "all",
    "property",
    "bank_balance",
    "business_investment",
    "cash",
    "vehicle",
    "equipment",
    "valuable",
    "other",
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = Number(value);
    if (!name.trim() || isNaN(numValue)) {
      toast.error("Valid name and value are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await createAsset({
        name,
        category,
        value: numValue,
        ownershipPercentage: Number(ownershipPercentage) || 100,
        location,
        notes,
        relatedPersonId:
          relatedPersonId !== "none" ? relatedPersonId : undefined,
        relatedBusinessId:
          relatedBusinessId !== "none" ? relatedBusinessId : undefined,
      });

      setAssets([created, ...assets]);
      toast.success(`Asset "${created.name}" recorded!`);
      setAddModalOpen(false);
      // Reset
      setName("");
      setValue("");
      setLocation("");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to record asset.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, assetName: string) => {
    if (!confirm(`Are you sure you want to remove "${assetName}"?`)) return;
    try {
      await deleteAsset(id);
      setAssets(assets.filter((a) => a._id !== id));
      toast.success("Asset removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove asset.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Valuation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Assets & Holdings Portfolio
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {assets.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total recorded holdings across properties, cash, bank deposits, and
            business investments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-muted-foreground font-medium">
              Portfolio Valuation
            </span>
            <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
              ৳{totalPortfolioValue.toLocaleString()}
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap capitalize transition-all ${
              categoryFilter === cat
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "all" ? "All Assets" : cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-border text-center space-y-2">
          <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-muted-foreground">
            No Assets Recorded
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Keep an audit-proof inventory of real estate, bank deposits,
            vehicles, and valuables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAssets.map((asset) => (
            <div
              key={asset._id}
              className="p-4 rounded-2xl bg-secondary border border-border hover:border-border transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    {asset.category.replace("_", " ")}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground font-mono">
                    {asset.ownershipPercentage}% Ownership
                  </span>
                </div>

                <h3 className="font-bold text-sm text-foreground mt-2 line-clamp-1">
                  {asset.name}
                </h3>

                <div className="mt-2 text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                  ৳{asset.value.toLocaleString()}
                </div>

                {asset.location && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Location: {asset.location}
                  </p>
                )}
                {asset.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {asset.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="capitalize">{asset.status}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(asset._id, asset.name)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-300" />
              <span>Record New Asset</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Asset Name *
              </label>
              <Input
                required
                placeholder="e.g. Uttara Commercial Plot or Prime Bank FD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssetCategory)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="property">Property / Real Estate</option>
                  <option value="bank_balance">Bank Balance / Deposit</option>
                  <option value="business_investment">
                    Business Investment
                  </option>
                  <option value="cash">Cash Reserve</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="equipment">Equipment / Hardware</option>
                  <option value="valuable">Gold / Valuables</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Valuation (৳) *
                </label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 5000000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Ownership Percentage (%)
                </label>
                <Input
                  type="number"
                  value={ownershipPercentage}
                  onChange={(e) => setOwnershipPercentage(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Physical Location
                </label>
                <Input
                  placeholder="e.g. Sector 4, Uttara, Dhaka"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Notes
              </label>
              <Input
                placeholder="Title deed details or bank account reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Asset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
