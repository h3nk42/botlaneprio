import { motion } from "framer-motion";
import { Champion } from "../lib/champions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Target, Shield, Zap, Skull, Users, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchupBreakdown {
  delta: number;
  confidence: number | null;
  games: number;
}

interface ScoreBreakdown {
  synergy: MatchupBreakdown | null;
  vsEnemySupport: MatchupBreakdown | null;
  vsEnemyBottom: MatchupBreakdown | null;
  allySupportMissing?: boolean;
  enemyBottomMissing?: boolean;
  threatBonus: number | null;
  allySuppName: string | null;
  enemySuppName: string | null;
  enemyBottomName: string | null;
  threatType: 'assassin' | 'tank' | 'poke' | null;
}

interface ChampionCardProps {
  champion: Champion;
  matchScore: number;
  breakdown?: ScoreBreakdown;
  onClick: (champion: Champion) => void;
  selected?: boolean;
}

export function ChampionCard({ champion, matchScore, breakdown, onClick, selected }: ChampionCardProps) {
  // Determine border color based on match score
  const scoreColor = matchScore >= 80 ? "border-primary" : matchScore >= 50 ? "border-blue-500/50" : "border-gray-800";
  const glowClass = matchScore >= 80 ? "shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "";
  
  // Check if we have any breakdown data to show
  const hasBreakdown = Boolean(
    breakdown
    && (
      breakdown.synergy
      || breakdown.allySupportMissing
      || breakdown.vsEnemySupport
      || breakdown.vsEnemyBottom
      || breakdown.enemyBottomMissing
      || breakdown.threatBonus !== null
    )
  );
  
  // Format delta value with + or - sign
  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatConfidence = (value: number | null) => {
    if (value === null) return null;
    return `±${value.toFixed(1)}%`;
  };

  const formatDeltaWithConfidence = (value: MatchupBreakdown) => {
    const confidence = formatConfidence(value.confidence);
    const games = value.games ? ` (n=${value.games.toLocaleString()})` : "";
    return confidence ? `${formatDelta(value.delta)} ${confidence}${games}` : `${formatDelta(value.delta)}${games}`;
  };
  
  // Get color class based on delta value
  const getDeltaColor = (value: number) => {
    if (value > 1) return 'text-green-400';
    if (value < -1) return 'text-red-400';
    return 'text-gray-400';
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div 
        onClick={() => onClick(champion)}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-300 bg-card",
          scoreColor,
          glowClass,
          selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
        )}
      >
        {/* Match Score Badge */}
        <div className="absolute top-2 right-2 z-20">
          <Badge 
            variant="outline" 
            className={cn(
              "font-heading font-bold text-lg backdrop-blur-md border-2",
              matchScore >= 80 ? "bg-primary/20 border-primary text-primary" : "bg-black/40 border-gray-600 text-gray-400"
            )}
          >
            {matchScore}% FIT
          </Badge>
        </div>


        {/* Image Background with Gradient Overlay */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
          <img 
            src={champion.image} 
            alt={champion.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        {/* Content */}
        <div className="p-4 relative z-10 -mt-8">
          <h3 className="text-2xl font-heading font-bold text-white mb-1 group-hover:text-primary transition-colors">
            {champion.name}
          </h3>
          <p className="text-muted-foreground text-xs font-ui uppercase tracking-wider mb-3">
            {champion.title}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {champion.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-ui font-medium">
                {tag}
              </span>
            ))}
          </div>

          {hasBreakdown ? (
            <div className="space-y-1.5 text-xs font-ui mt-2 pt-2 border-t border-white/5">
              {(breakdown.synergy || breakdown.allySupportMissing) && breakdown.allySuppName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-3 h-3 text-green-400" />
                    <span>w/ {breakdown.allySuppName}</span>
                  </div>
                  {breakdown.synergy ? (
                    <span className={cn("font-medium", getDeltaColor(breakdown.synergy.delta))}>
                      {formatDeltaWithConfidence(breakdown.synergy)}
                    </span>
                  ) : (
                    <span className="font-medium text-gray-500 italic">No data</span>
                  )}
                </div>
              )}
              {breakdown.vsEnemySupport && breakdown.enemySuppName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>vs {breakdown.enemySuppName}</span>
                  </div>
                  <span className={cn("font-medium", getDeltaColor(breakdown.vsEnemySupport.delta))}>
                    {formatDeltaWithConfidence(breakdown.vsEnemySupport)}
                  </span>
                </div>
              )}
              {(breakdown.vsEnemyBottom || breakdown.enemyBottomMissing) && breakdown.enemyBottomName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Swords className="w-3 h-3 text-red-400" />
                    <span>vs {breakdown.enemyBottomName}</span>
                  </div>
                  {breakdown.vsEnemyBottom ? (
                    <span className={cn("font-medium", getDeltaColor(breakdown.vsEnemyBottom.delta))}>
                      {formatDeltaWithConfidence(breakdown.vsEnemyBottom)}
                    </span>
                  ) : (
                    <span className="font-medium text-gray-500 italic">No data</span>
                  )}
                </div>
              )}
              {breakdown.threatBonus !== null && breakdown.threatType && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Skull className="w-3 h-3 text-purple-400" />
                    <span>vs {breakdown.threatType}</span>
                  </div>
                  <span className="font-medium text-green-400">
                    Strong
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 font-ui mt-2 pt-2 border-t border-white/5 text-center italic">
              Select matchup to see stats
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
