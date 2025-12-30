import { useState, useMemo, useEffect } from "react";
import { adcs, supports, botLaners, Champion } from "@/lib/champions";
import { MATCHUP_DATA, SUPPORT_MATCHUP_DATA, confidenceMargin, weightedDelta } from "@/lib/matchup-data";
import { ChampionCard } from "@/components/ChampionCard";
import { FilterBar } from "@/components/FilterBar";
import { DraftsPanel } from "@/components/DraftsPanel";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import generatedBg from "@assets/generated_images/abstract_hextech_background_with_blue_magic_and_gold_accents.png";

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

export default function Home() {
  const [location, setLocation] = useLocation();
  const [selectedAllySupport, setSelectedAllySupport] = useState<string | null>(null);
  const [selectedEnemySupport, setSelectedEnemySupport] = useState<string | null>(null);
  const [selectedEnemyADC, setSelectedEnemyADC] = useState<string | null>(null);
  const [selectedEnemyThreat, setSelectedEnemyThreat] = useState<'assassin' | 'tank' | 'poke' | null>(null);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const allySupport = params.get("allySupport");
    const enemySupport = params.get("enemySupport");
    const enemyAdc = params.get("enemyAdc");
    const threat = params.get("threat");

    const isAllySupportValid = Boolean(allySupport && supports.some(s => s.id === allySupport));
    const isEnemySupportValid = Boolean(enemySupport && supports.some(s => s.id === enemySupport));

    if (isAllySupportValid) {
      setSelectedAllySupport(allySupport);
    }

    if (isEnemySupportValid && enemySupport !== allySupport) {
      setSelectedEnemySupport(enemySupport);
    }
    if (enemyAdc && botLaners.some(b => b.id === enemyAdc)) {
      setSelectedEnemyADC(enemyAdc);
    }
    if (threat === "assassin" || threat === "tank" || threat === "poke") {
      setSelectedEnemyThreat(threat);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAllySupport) params.set("allySupport", selectedAllySupport);
    if (selectedEnemySupport) params.set("enemySupport", selectedEnemySupport);
    if (selectedEnemyADC) params.set("enemyAdc", selectedEnemyADC);
    if (selectedEnemyThreat) params.set("threat", selectedEnemyThreat);

    const query = params.toString();
    const nextLocation = query ? `/?${query}` : "/";
    if (location !== nextLocation) {
      setLocation(nextLocation, { replace: true });
    }
  }, [location, selectedAllySupport, selectedEnemySupport, selectedEnemyADC, selectedEnemyThreat, setLocation]);

  const handleSelectAllySupport = (value: string | null) => {
    setSelectedAllySupport(value);
    if (value && value === selectedEnemySupport) {
      setSelectedEnemySupport(null);
    }
  };

  const handleSelectEnemySupport = (value: string | null) => {
    setSelectedEnemySupport(value);
    if (value && value === selectedAllySupport) {
      setSelectedAllySupport(null);
    }
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    const championId = adcs.find(a => a.name === draft.adcChampion)?.id;
    if (championId) {
      const champ = adcs.find(a => a.id === championId);
      if (champ) setSelectedChampion(champ);
    }
    setSelectedAllySupport(draft.allySupport || null);
    setSelectedEnemySupport(draft.enemySupport || null);
    setSelectedEnemyADC(draft.enemyAdc || null);
    setSelectedEnemyThreat((draft.enemyThreat as any) || null);
  };

  // Scoring Logic - Uses Delta 2 matchup data from LoLalytics
  const scoredChampions = useMemo(() => {
    const combineMatchupValues = (values: Array<{ delta: number; games: number }>) => {
      if (values.length === 0) return null;
      const totalGames = values.reduce((sum, value) => sum + (value.games ?? 0), 0);
      if (totalGames > 0) {
        const weightedDelta = values.reduce((sum, value) => sum + value.delta * (value.games ?? 0), 0) / totalGames;
        return { delta: weightedDelta, games: totalGames };
      }
      const averageDelta = values.reduce((sum, value) => sum + value.delta, 0) / values.length;
      return { delta: averageDelta, games: 0 };
    };

    // Get names for display
    const allySuppName = selectedAllySupport ? supports.find(s => s.id === selectedAllySupport)?.name : null;
    const enemySuppName = selectedEnemySupport ? supports.find(s => s.id === selectedEnemySupport)?.name : null;
    const enemyBottomName = selectedEnemyADC ? botLaners.find(a => a.id === selectedEnemyADC)?.name : null;

    // Calculate raw scores using real matchup data
    const rawScores = adcs.map(champ => {
      let score = 0;
      let hasData = false;

      // Track individual score components for breakdown
      let synergyInfo: { delta: number; confidence: number | null; games: number } | null = null;
      let allySupportMissing = false;
      let vsEnemySupportInfo: { delta: number; confidence: number | null; games: number } | null = null;
      let vsEnemyBottomInfo: { delta: number; confidence: number | null; games: number } | null = null;
      let enemyBottomMissing = false;
      let threatBonus: number | null = null;

      // Get matchup data for this ADC
      const adcMatchup = MATCHUP_DATA[champ.name];
      if (adcMatchup) {
        hasData = true;
      }

      // Ally support synergy - the primary factor (higher = better pairing)
      if (selectedAllySupport && allySuppName) {
        const synergyCandidates = [];
        const adcSynergy = adcMatchup?.synergy?.[allySuppName];
        if (adcSynergy) synergyCandidates.push(adcSynergy);
        const supportSynergy = allySuppName ? SUPPORT_MATCHUP_DATA[allySuppName]?.synergyBottom?.[champ.name] : undefined;
        if (supportSynergy) synergyCandidates.push(supportSynergy);

        const combinedSynergy = combineMatchupValues(synergyCandidates);
        if (combinedSynergy) {
          synergyInfo = {
            delta: combinedSynergy.delta,
            confidence: confidenceMargin(combinedSynergy),
            games: combinedSynergy.games ?? 0,
          };
          score += weightedDelta(combinedSynergy) * 2;
        } else {
          allySupportMissing = true;
        }
      }

      // Enemy support counter - how well we perform vs enemy support (higher = we win more)
      if (selectedEnemySupport && adcMatchup?.counters && enemySuppName) {
        const enemySupportCandidates = [];
        const adcVsEnemySupport = adcMatchup.counters[enemySuppName];
        if (adcVsEnemySupport) enemySupportCandidates.push(adcVsEnemySupport);
        const supportVsBottom = SUPPORT_MATCHUP_DATA[enemySuppName]?.vsBottom?.[champ.name];
        if (supportVsBottom) {
          enemySupportCandidates.push({ delta: -supportVsBottom.delta, games: supportVsBottom.games ?? 0 });
        }

        const combinedEnemySupport = combineMatchupValues(enemySupportCandidates);
        if (combinedEnemySupport) {
          vsEnemySupportInfo = {
            delta: combinedEnemySupport.delta,
            confidence: confidenceMargin(combinedEnemySupport),
            games: combinedEnemySupport.games ?? 0,
          };
          score += weightedDelta(combinedEnemySupport) * 0.5;
        }
      }

      // Enemy bottom matchup - how well we perform vs enemy bot laner (higher = we win more)
      if (selectedEnemyADC && enemyBottomName && adcMatchup) {
        const enemyBottomCandidates = [];
        const adcVsEnemyBottom = adcMatchup.enemyBottom?.[enemyBottomName];
        if (adcVsEnemyBottom) enemyBottomCandidates.push(adcVsEnemyBottom);
        const enemyMatchup = MATCHUP_DATA[enemyBottomName];
        const enemyVsUs = enemyMatchup?.enemyBottom?.[champ.name];
        if (enemyVsUs) {
          enemyBottomCandidates.push({ delta: -enemyVsUs.delta, games: enemyVsUs.games ?? 0 });
        }

        const combinedEnemyBottom = combineMatchupValues(enemyBottomCandidates);
        if (combinedEnemyBottom) {
          vsEnemyBottomInfo = {
            delta: combinedEnemyBottom.delta,
            confidence: confidenceMargin(combinedEnemyBottom),
            games: combinedEnemyBottom.games ?? 0,
          };
          score += weightedDelta(combinedEnemyBottom) * 0.2;
        } else {
          enemyBottomMissing = true;
        }
      }

      // Enemy composition threat - bonus if this ADC counters the threat type
      if (selectedEnemyThreat && champ.counters.includes(selectedEnemyThreat)) {
        threatBonus = 2; // Flat bonus for countering the threat type
        score += threatBonus;
        hasData = true;
      }

      return {
        champ,
        rawScore: score,
        hasData,
        breakdown: {
          synergy: synergyInfo,
          allySupportMissing,
          vsEnemySupport: vsEnemySupportInfo,
          vsEnemyBottom: vsEnemyBottomInfo,
          enemyBottomMissing,
          threatBonus,
          allySuppName,
          enemySuppName,
          enemyBottomName,
          threatType: selectedEnemyThreat
        }
      };
    });

    // Only consider champions with synergy data for normalization
    const champsWithData = rawScores.filter(r => r.hasData);
    const scoresWithData = champsWithData.map(r => r.rawScore);
    const minRawScore = scoresWithData.length > 0 ? Math.min(...scoresWithData) : 0;
    const maxRawScore = scoresWithData.length > 0 ? Math.max(...scoresWithData) : 0;

    // Normalize to 0-100 scale
    const allBlind = !selectedAllySupport && !selectedEnemySupport && !selectedEnemyADC && !selectedEnemyThreat;

    return rawScores.map(({ champ, rawScore, hasData, breakdown }) => {
      let normalizedScore: number;

      if (allBlind) {
        normalizedScore = 50;
      } else if (!hasData) {
        normalizedScore = 50;
      } else if (maxRawScore === minRawScore) {
        normalizedScore = 50;
      } else {
        normalizedScore = 20 + ((rawScore - minRawScore) / (maxRawScore - minRawScore)) * 80;
      }

      return { ...champ, score: Math.round(normalizedScore), breakdown };
    })
      .filter(champ => champ.id !== selectedAllySupport)
      .sort((a, b) => b.score - a.score);
  }, [selectedAllySupport, selectedEnemySupport, selectedEnemyADC, selectedEnemyThreat]);

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary selection:text-black">
      {/* Background with overlay */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${generatedBg})` }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-background/80 via-background/95 to-background" />

      <main className="container mx-auto px-4 py-8">

        {/* Header */}
        <header className="text-center mb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary via-yellow-200 to-primary/60 mb-2 drop-shadow-lg">
              BOT LANE PRIO
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
            <p className="text-blue-200/60 font-ui tracking-[0.3em] uppercase mt-4 text-sm md:text-base">
              Analyze Matchups • Optimize Picks • Dominate Lane
            </p>
          </motion.div>

          <div className="mt-6">
            <Link href="/support">
              <a className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors font-ui text-sm" data-testid="link-support-picker">
                <img
                  src="https://cdn5.lolalytics.com/lane54/support.webp"
                  alt="Support role icon"
                  className="h-5 w-5 rounded-full"
                  loading="lazy"
                />
                <span>Support Picker</span>
              </a>
            </Link>
          </div>
        </header>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FilterBar
            selectedAllySupport={selectedAllySupport}
            selectedEnemySupport={selectedEnemySupport}
            selectedEnemyADC={selectedEnemyADC}
            selectedEnemyThreat={selectedEnemyThreat}
            onSelectAllySupport={handleSelectAllySupport}
            onSelectEnemySupport={handleSelectEnemySupport}
            onSelectEnemyADC={setSelectedEnemyADC}
            onSelectEnemyThreat={setSelectedEnemyThreat}
          />
        </motion.div>

        {/* Selected Champion Detail Overlay */}
        <AnimatePresence>
          {selectedChampion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-card/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <img
                  src={selectedChampion.image}
                  alt={selectedChampion.name}
                  className="w-full md:w-64 h-64 object-cover rounded-lg border border-white/10 shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl font-heading text-white mb-1">{selectedChampion.name}</h2>
                      <p className="text-primary font-ui text-lg">{selectedChampion.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedChampion(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      Close
                    </Button>
                  </div>

                  <p className="mt-6 text-gray-300 leading-relaxed max-w-2xl text-lg">
                    {selectedChampion.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-black/40 p-3 rounded border border-white/5">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Difficulty</span>
                      <span className="text-white font-ui">{selectedChampion.difficulty}</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded border border-white/5">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Synergy</span>
                      <span className="text-white font-ui capitalize">{selectedChampion.synergies.join(", ")}</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded border border-white/5">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Counters</span>
                      <span className="text-white font-ui capitalize">{selectedChampion.counters.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-heading text-white flex items-center gap-2">
              <ChevronRight className="text-primary" />
              Recommended Picks
            </h3>
            <span className="text-xs text-gray-500 font-ui">Sorted by Match Fit</span>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {scoredChampions.map((champ) => (
                <ChampionCard
                  key={champ.id}
                  champion={champ}
                  matchScore={champ.score}
                  breakdown={champ.breakdown}
                  onClick={setSelectedChampion}
                  selected={selectedChampion?.id === champ.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

      </main>

      <DraftsPanel
        currentAdc={selectedChampion?.name || null}
        currentAllySupport={selectedAllySupport ? supports.find(s => s.id === selectedAllySupport)?.name || null : null}
        currentEnemyAdc={selectedEnemyADC ? botLaners.find(e => e.id === selectedEnemyADC)?.name || null : null}
        currentEnemySupport={selectedEnemySupport ? supports.find(s => s.id === selectedEnemySupport)?.name || null : null}
        currentEnemyThreat={selectedEnemyThreat}
        onLoadDraft={handleLoadDraft}
      />
    </div>
  );
}
