import { motion } from "framer-motion";
import { SupportChampion } from "../lib/champions";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Swords, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchupBreakdown {
  delta: number;
  confidence: number | null;
  games: number;
}

interface ScoreBreakdown {
  synergy: MatchupBreakdown | null;
  vsEnemySupport: MatchupBreakdown | null;
  vsEnemyBot: MatchupBreakdown | null;
  threatBonus: number | null;
  allyAdcName: string | null;
  enemySuppName: string | null;
  enemyBotName: string | null;
  threatType: 'assassin' | 'tank' | 'poke' | null;
}

interface SupportCardProps {
  support: SupportChampion;
  matchScore: number;
  breakdown?: ScoreBreakdown;
  onClick: (support: SupportChampion) => void;
  selected?: boolean;
}

export function SupportCard({ support, matchScore, breakdown, onClick, selected }: SupportCardProps) {
  const scoreColor = matchScore >= 80 ? "border-blue-400" : matchScore >= 50 ? "border-blue-500/50" : "border-gray-800";
  const glowClass = matchScore >= 80 ? "shadow-[0_0_15px_rgba(96,165,250,0.3)]" : "";
  
  const hasBreakdown = Boolean(
    breakdown
    && (breakdown.synergy || breakdown.vsEnemySupport || breakdown.vsEnemyBot || breakdown.threatBonus !== null)
  );
  
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
  
  const getDeltaColor = (value: number) => {
    if (value > 0.5) return 'text-green-400';
    if (value < -0.5) return 'text-red-400';
    return 'text-gray-400';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'engage': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'enchanter': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'poke': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
        onClick={() => onClick(support)}
        data-testid={`card-support-${support.id}`}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-300 bg-card",
          scoreColor,
          glowClass,
          selected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-background" : ""
        )}
      >
        <div className="absolute top-2 right-2 z-20">
          <Badge 
            variant="outline" 
            className={cn(
              "font-heading font-bold text-lg backdrop-blur-md border-2",
              matchScore >= 80 ? "bg-blue-400/20 border-blue-400 text-blue-400" : "bg-black/40 border-gray-600 text-gray-400"
            )}
          >
            {matchScore}% FIT
          </Badge>
        </div>

        <div className="absolute top-2 left-2 z-20">
          <Badge className={cn("font-heading border backdrop-blur-sm capitalize", getTypeColor(support.type))}>
            {support.type}
          </Badge>
        </div>

        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
          <img 
            src={support.image} 
            alt={support.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="p-4 relative z-10 -mt-8">
          <h3 className="text-2xl font-heading font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
            {support.name}
          </h3>
          <p className="text-muted-foreground text-xs font-ui uppercase tracking-wider mb-3 capitalize">
            {support.type} Support
          </p>

          {hasBreakdown ? (
            <div className="space-y-1.5 text-xs font-ui mt-2 pt-2 border-t border-white/5">
              {breakdown.synergy && breakdown.allyAdcName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-3 h-3 text-green-400" />
                    <span>w/ {breakdown.allyAdcName}</span>
                  </div>
                  <span className={cn("font-medium", getDeltaColor(breakdown.synergy.delta))}>
                    {formatDeltaWithConfidence(breakdown.synergy)}
                  </span>
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
              {breakdown.vsEnemyBot && breakdown.enemyBotName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Swords className="w-3 h-3 text-red-400" />
                    <span>vs {breakdown.enemyBotName}</span>
                  </div>
                  <span className={cn("font-medium", getDeltaColor(breakdown.vsEnemyBot.delta))}>
                    {formatDeltaWithConfidence(breakdown.vsEnemyBot)}
                  </span>
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
