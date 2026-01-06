import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock } from "lucide-react";
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
  const queryClient = useQueryClient();

  const { data: drafts = [] } = useQuery({
    queryKey: ["/api/drafts"],
    queryFn: async () => {
      const res = await fetch("/api/drafts");
      return res.json();
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
    </div>
  );
}
