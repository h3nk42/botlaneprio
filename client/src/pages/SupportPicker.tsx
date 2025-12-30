import { useState, useMemo, useEffect } from "react";
import { adcs, supports, botLaners, SupportChampion } from "@/lib/champions";
import { MATCHUP_DATA, SUPPORT_MATCHUP_DATA, confidenceMargin, weightedDelta } from "@/lib/matchup-data";
import { SupportCard } from "@/components/SupportCard";
import { SupportFilterBar } from "@/components/SupportFilterBar";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Shield, Crosshair } from "lucide-react";
import { Link, useLocation } from "wouter";
import generatedBg from "@assets/generated_images/abstract_hextech_background_with_blue_magic_and_gold_accents.png";
import { Button } from "@/components/ui/button";

export default function SupportPicker() {
  const [location, setLocation] = useLocation();
  const [selectedAllyADC, setSelectedAllyADC] = useState<string | null>(null);
  const [selectedEnemySupport, setSelectedEnemySupport] = useState<string | null>(null);
  const [selectedEnemyBot, setSelectedEnemyBot] = useState<string | null>(null);
  const [selectedEnemyThreat, setSelectedEnemyThreat] = useState<'assassin' | 'tank' | 'poke' | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<SupportChampion | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const allyAdc = params.get("allyAdc");
    const enemySupport = params.get("enemySupport");
    const enemyBot = params.get("enemyBot");
    const threat = params.get("threat");

    if (allyAdc && adcs.some(a => a.id === allyAdc)) {
      setSelectedAllyADC(allyAdc);
    }
    if (enemySupport && supports.some(s => s.id === enemySupport)) {
      setSelectedEnemySupport(enemySupport);
    }
    if (enemyBot && botLaners.some(b => b.id === enemyBot)) {
      setSelectedEnemyBot(enemyBot);
    }
    if (threat === "assassin" || threat === "tank" || threat === "poke") {
      setSelectedEnemyThreat(threat);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAllyADC) params.set("allyAdc", selectedAllyADC);
    if (selectedEnemySupport) params.set("enemySupport", selectedEnemySupport);
    if (selectedEnemyBot) params.set("enemyBot", selectedEnemyBot);
    if (selectedEnemyThreat) params.set("threat", selectedEnemyThreat);

    const query = params.toString();
    const nextLocation = query ? `/support?${query}` : "/support";
    if (location !== nextLocation) {
      setLocation(nextLocation, { replace: true });
    }
  }, [location, selectedAllyADC, selectedEnemySupport, selectedEnemyBot, selectedEnemyThreat, setLocation]);

  const scoredSupports = useMemo(() => {
    const allyAdcName = selectedAllyADC ? adcs.find(a => a.id === selectedAllyADC)?.name : null;
    const enemySuppName = selectedEnemySupport ? supports.find(s => s.id === selectedEnemySupport)?.name : null;
    const enemyBotName = selectedEnemyBot ? botLaners.find(a => a.id === selectedEnemyBot)?.name : null;

    const rawScores = supports.map(supp => {
      let score = 0;
      let hasData = false;

      let synergyInfo: { delta: number; confidence: number | null; games: number } | null = null;
      let vsEnemySupportInfo: { delta: number; confidence: number | null; games: number } | null = null;
      let vsEnemyBotInfo: { delta: number; confidence: number | null; games: number } | null = null;
      let threatBonus: number | null = null;

      // Synergy with ally ADC - look up ADC's synergy data for this support
      // Higher synergy = better pairing
      if (selectedAllyADC && allyAdcName) {
        const adcMatchup = MATCHUP_DATA[allyAdcName];
        const supportMatchup = SUPPORT_MATCHUP_DATA[supp.name];
        const bottomSynergy = adcMatchup?.synergy?.[supp.name];
        const supportSynergy = supportMatchup?.synergyBottom?.[allyAdcName];
        const synergyValues = [bottomSynergy, supportSynergy].filter(Boolean) as { delta: number; games: number }[];
        if (synergyValues.length > 0) {
          const totalGames = synergyValues.reduce((sum, value) => sum + (value.games ?? 0), 0);
          const combinedDelta = totalGames > 0
            ? synergyValues.reduce((sum, value) => sum + value.delta * (value.games ?? 0), 0) / totalGames
            : synergyValues.reduce((sum, value) => sum + value.delta, 0) / synergyValues.length;
          const combinedValue = { delta: combinedDelta, games: totalGames };
          synergyInfo = {
            delta: combinedDelta,
            confidence: confidenceMargin(combinedValue),
            games: totalGames,
          };
          score += weightedDelta(combinedValue) * 2; // Primary factor
          hasData = true;
        }
      }

      // vs Enemy Bot - look up how enemy ADC performs against this support
      // Enemy ADC's counters[support] shows their performance vs this support
      // Positive = enemy ADC wins more vs this support = BAD for us
      // So we NEGATE the value: good for enemy = bad for us
      if (selectedEnemyBot && enemyBotName) {
        const enemyAdcMatchup = MATCHUP_DATA[enemyBotName];
        if (enemyAdcMatchup?.counters) {
          const enemyVsSupport = enemyAdcMatchup.counters[supp.name];
          if (enemyVsSupport !== undefined) {
            // Negate: if enemy performs well (+), it's bad for our support (-)
            vsEnemyBotInfo = {
              delta: -enemyVsSupport.delta,
              confidence: confidenceMargin(enemyVsSupport),
              games: enemyVsSupport.games ?? 0,
            };
            const weightedVsEnemyBot = -weightedDelta(enemyVsSupport);
            score += weightedVsEnemyBot * 1.5; // Second priority
            hasData = true;
          }
        }
      }

      // vs Enemy Support - use actual support vs support matchup data
      if (selectedEnemySupport && enemySuppName) {
        const supportMatchup = SUPPORT_MATCHUP_DATA[supp.name];
        if (supportMatchup?.vsSupport) {
          const vsEnemy = supportMatchup.vsSupport[enemySuppName];
          if (vsEnemy !== undefined) {
            vsEnemySupportInfo = {
              delta: vsEnemy.delta,
              confidence: confidenceMargin(vsEnemy),
              games: vsEnemy.games ?? 0,
            };
            score += weightedDelta(vsEnemy); // Third priority
            hasData = true;
          }
        }
      }

      // Composition threat bonus - supports that counter certain team comps
      if (selectedEnemyThreat) {
        const threatCounters: Record<string, string[]> = {
          'assassin': ['enchanter'], // Enchanters protect vs assassins with shields/heals
          'tank': ['poke'],          // Poke supports whittle down tanks
          'poke': ['engage']         // Engage supports close the gap on poke
        };
        if (threatCounters[selectedEnemyThreat]?.includes(supp.type)) {
          threatBonus = 2;
          score += threatBonus;
          hasData = true;
        }
      }

      return {
        supp,
        rawScore: score,
        hasData,
        breakdown: {
          synergy: synergyInfo,
          vsEnemySupport: vsEnemySupportInfo,
          vsEnemyBot: vsEnemyBotInfo,
          threatBonus,
          allyAdcName,
          enemySuppName,
          enemyBotName,
          threatType: selectedEnemyThreat
        }
      };
    });

    const champsWithData = rawScores.filter(r => r.hasData);
    const scoresWithData = champsWithData.map(r => r.rawScore);
    const minRawScore = scoresWithData.length > 0 ? Math.min(...scoresWithData) : 0;
    const maxRawScore = scoresWithData.length > 0 ? Math.max(...scoresWithData) : 0;

    const allBlind = !selectedAllyADC && !selectedEnemySupport && !selectedEnemyBot && !selectedEnemyThreat;

    return rawScores.map(({ supp, rawScore, hasData, breakdown }) => {
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

      return { ...supp, score: Math.round(normalizedScore), breakdown };
    })
      .filter(supp => supp.id !== selectedAllyADC)
      .sort((a, b) => b.score - a.score);
  }, [selectedAllyADC, selectedEnemySupport, selectedEnemyBot, selectedEnemyThreat]);

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary selection:text-black">
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${generatedBg})` }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-background/80 via-background/95 to-background" />

      <main className="container mx-auto px-4 py-8">

        <header className="text-center mb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block"
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-b from-blue-400 via-blue-200 to-blue-400/60 mb-2 drop-shadow-lg">
              BOT LANE PRIO
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
            <p className="text-blue-200/60 font-ui tracking-[0.3em] uppercase mt-4 text-sm md:text-base">
              Analyze Matchups • Optimize Picks • Dominate Lane
            </p>
          </motion.div>

          <div className="mt-6">
            <Link href="/">
              <a className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors font-ui text-sm" data-testid="link-adc-picker">
                <img
                  src="https://wiki.leagueoflegends.com/en-us/images/All_roles_icon.png?d9e6c"
                  alt="Bottom role icon"
                  className="h-5 w-5 rounded-full bg-white/10 p-[2px]"
                  loading="lazy"
                />
                <span>Bottom Picker</span>
              </a>
            </Link>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SupportFilterBar
            selectedAllyADC={selectedAllyADC}
            selectedEnemySupport={selectedEnemySupport}
            selectedEnemyBot={selectedEnemyBot}
            selectedEnemyThreat={selectedEnemyThreat}
            onSelectAllyADC={setSelectedAllyADC}
            onSelectEnemySupport={setSelectedEnemySupport}
            onSelectEnemyBot={setSelectedEnemyBot}
            onSelectEnemyThreat={setSelectedEnemyThreat}
          />
        </motion.div>

        <AnimatePresence>
          {selectedSupport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-900/40 via-card to-blue-900/40 rounded-xl border border-blue-500/30 p-6">
                <div className="flex flex-col items-start md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <img
                      src={selectedSupport.image}
                      alt={selectedSupport.name}
                      className="w-full h-48 object-cover object-top rounded-lg border-2 border-blue-500/50"
                    />

                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <h2 className="text-3xl font-heading font-bold text-white">{selectedSupport.name}</h2>
                      <p className="text-blue-400 font-ui uppercase tracking-wider text-sm capitalize">{selectedSupport.type} Support</p>
                    </div>

                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedSupport(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-heading text-white flex items-center gap-2">
              <ChevronRight className="text-blue-400" />
              Recommended Supports
            </h3>
            <span className="text-xs text-gray-500 font-ui">Sorted by Match Fit</span>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {scoredSupports.map((supp) => (
                <SupportCard
                  key={supp.id}
                  support={supp}
                  matchScore={supp.score}
                  breakdown={supp.breakdown}
                  onClick={setSelectedSupport}
                  selected={selectedSupport?.id === supp.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
