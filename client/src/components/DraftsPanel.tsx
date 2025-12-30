import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Save, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedDraft {
  id: string;
  name: string;
  adcChampion: string;
  allySupport?: string;
  enemyAdc?: string;
  enemySupport?: string;
  enemyThreat?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DraftsPanelProps {
  currentAdc: string | null;
  currentAllySupport: string | null;
  currentEnemyAdc: string | null;
  currentEnemySupport: string | null;
  currentEnemyThreat: string | null;
  onLoadDraft: (draft: SavedDraft) => void;
}

export function DraftsPanel({
  currentAdc,
  currentAllySupport,
  currentEnemyAdc,
  currentEnemySupport,
  currentEnemyThreat,
  onLoadDraft,
}: DraftsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: drafts = [] } = useQuery({
    queryKey: ["/api/drafts"],
    queryFn: async () => {
      const res = await fetch("/api/drafts");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentAdc || !draftName.trim()) return;
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          adcChampion: currentAdc,
          allySupport: currentAllySupport,
          enemyAdc: currentEnemyAdc,
          enemySupport: currentEnemySupport,
          enemyThreat: currentEnemyThreat,
          notes: draftNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drafts"] });
      setDraftName("");
      setDraftNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drafts"] });
    },
  });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-16 right-0 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl p-4 w-80 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <h3 className="font-heading text-primary text-lg mb-4">Save Draft</h3>
            
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Draft name (e.g., 'Lane vs Zed')"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/60"
              />
              <textarea
                placeholder="Notes..."
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/60 resize-none h-20"
              />
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!currentAdc || !draftName.trim() || saveMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Recent Drafts</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {drafts.length === 0 ? (
                  <p className="text-xs text-gray-500">No saved drafts yet</p>
                ) : (
                  drafts.map((draft: SavedDraft) => (
                    <div
                      key={draft.id}
                      className="bg-black/40 p-2 rounded border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                      onClick={() => {
                        onLoadDraft(draft);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-heading text-white">{draft.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(draft.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(draft.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "rounded-full w-14 h-14 shadow-lg transition-all",
          isOpen
            ? "bg-red-500/20 border-red-500 text-red-400"
            : "bg-primary/20 border-primary text-primary hover:bg-primary/30"
        )}
      >
        <Save className="w-6 h-6" />
      </Button>
    </div>
  );
}
