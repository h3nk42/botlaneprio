import { useState } from "react";
import { SupportType, EnemyThreat, supports, botLaners, adcs } from "@/lib/champions";
import { Shield, Skull, Crosshair, Check, ChevronsUpDown, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  selectedAllySupport: string | null;
  selectedEnemySupport: string | null;
  selectedEnemyADC: string | null;
  selectedEnemyThreat: EnemyThreat | null;
  onSelectAllySupport: (id: string | null) => void;
  onSelectEnemySupport: (id: string | null) => void;
  onSelectEnemyADC: (id: string | null) => void;
  onSelectEnemyThreat: (type: EnemyThreat | null) => void;
}

export function FilterBar({
  selectedAllySupport,
  selectedEnemySupport,
  selectedEnemyADC,
  selectedEnemyThreat,
  onSelectAllySupport,
  onSelectEnemySupport,
  onSelectEnemyADC,
  onSelectEnemyThreat
}: FilterBarProps) {
  const allySupp = supports.find(s => s.id === selectedAllySupport);
  const enemySupp = supports.find(s => s.id === selectedEnemySupport);
  const enemyChamp = botLaners.find(e => e.id === selectedEnemyADC);

  const getAllySupportLabel = () => {
    if (!selectedAllySupport) return "Blind Pick";
    return allySupp?.name || "Blind Pick";
  };

  const getEnemySupportLabel = () => {
    if (!selectedEnemySupport) return "Blind Pick";
    return enemySupp?.name || "Blind Pick";
  };

  const getEnemyADCLabel = () => {
    if (!selectedEnemyADC) return "Blind Pick";
    return enemyChamp?.name || "Blind Pick";
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto mb-12">

      {/* ALLY SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent flex-1" />
          <h2 className="text-xl font-heading text-primary tracking-widest uppercase px-4">Your Team</h2>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComboboxDropdown
            label="Ally Support"
            placeholder="Search support..."
            value={selectedAllySupport}
            onChange={onSelectAllySupport}
            options={supports.map(s => ({ value: s.id, label: s.name, type: s.type }))}
            selectedLabel={getAllySupportLabel()}
            selectedImage={allySupp?.imageSmall || null}
            weight="2.0"
            data-testid="combobox-ally-support"
            isAllySupport
          />
        </div>
      </div>

      {/* ENEMY SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent flex-1" />
          <h2 className="text-xl font-heading text-red-400 tracking-widest uppercase px-4">Enemy Team</h2>
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComboboxDropdown
            label="Enemy Bottom"
            placeholder="Search enemy bot..."
            value={selectedEnemyADC}
            onChange={onSelectEnemyADC}
            options={botLaners.map(e => ({ value: e.id, label: e.name, type: 'bot' }))}
            selectedLabel={getEnemyADCLabel()}
            selectedImage={enemyChamp?.imageSmall || null}
            weight="0.2"
            isDanger
            data-testid="combobox-enemy-bot"
          />
          <ComboboxDropdown
            label="Enemy Support"
            placeholder="Search enemy support..."
            value={selectedEnemySupport}
            onChange={onSelectEnemySupport}
            options={supports.map(s => ({ value: s.id, label: s.name, type: s.type }))}
            selectedLabel={getEnemySupportLabel()}
            selectedImage={enemySupp?.imageSmall || null}
            weight="0.5"
            isDanger
            data-testid="combobox-enemy-support"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-heading uppercase tracking-widest text-gray-400">Composition Threat</label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">+BONUS</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ThreatButton
                active={selectedEnemyThreat === 'assassin'}
                onClick={() => onSelectEnemyThreat(selectedEnemyThreat === 'assassin' ? null : 'assassin')}
                icon={<Skull className="w-4 h-4" />}
                label="Assassins"
              />
              <ThreatButton
                active={selectedEnemyThreat === 'tank'}
                onClick={() => onSelectEnemyThreat(selectedEnemyThreat === 'tank' ? null : 'tank')}
                icon={<Shield className="w-4 h-4" />}
                label="Tanks"
              />
              <ThreatButton
                active={selectedEnemyThreat === 'poke'}
                onClick={() => onSelectEnemyThreat(selectedEnemyThreat === 'poke' ? null : 'poke')}
                icon={<Crosshair className="w-4 h-4" />}
                label="Poke"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComboboxDropdownProps {
  label: string;
  placeholder: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Array<{ value: string; label: string; type: string }>;
  selectedLabel?: string;
  selectedImage?: string | null;
  weight?: string;
  isDanger?: boolean;
  isAllySupport?: boolean;
  "data-testid"?: string;
}

function ComboboxDropdown({
  label,
  placeholder,
  value,
  onChange,
  options,
  selectedLabel,
  selectedImage,
  weight,
  isDanger = false,
  isAllySupport = false,
  "data-testid": testId
}: ComboboxDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-heading uppercase tracking-widest text-gray-400">{label}</label>
        {weight && (
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded border",
            isDanger
              ? "bg-red-500/20 text-red-400 border-red-500/30" :
              "bg-green-500/20 text-green-400 border-green-500/30"
          )}>
            ×{weight}
          </span>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            data-testid={testId}
            className={cn(
              "w-full justify-between border-2 bg-card/50 text-white rounded-lg h-12 font-ui hover:bg-card/70",
              isDanger
                ? "border-red-500/30 hover:border-red-500/60" : isAllySupport ? "border-blue-500/30 hover:border-blue-500/60"
                  : "border-primary/30 hover:border-primary/60",
              !value && "text-gray-400"
            )}
          >
            <span className="flex items-center gap-3 truncate">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt=""
                  className="h-8 w-8 rounded-md object-cover object-top border border-white/10"
                  loading="lazy"
                />
              ) : (
                <span className="h-8 w-8 rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
                  {!value && <HelpCircle className="h-4 w-4 text-gray-400" />}
                </span>
              )}
              <span className="truncate">{selectedLabel || placeholder}</span>
            </span>
            <span className="ml-auto flex items-center gap-2">
              {value && (
                <span
                  role="button"
                  aria-label={`Clear ${label}`}
                  className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-white/10" align="start">
          <Command className="bg-transparent">
            <CommandInput
              placeholder={placeholder}
              className="h-10 text-white"
            />
            <CommandList>
              <CommandEmpty className="text-gray-400 py-4">No champion found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="Blind Pick"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-gray-400 cursor-pointer"
                  data-testid={testId ? `${testId}-option-blind` : undefined}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Blind Pick
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="text-white cursor-pointer"
                    data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div >
  );
}

interface ThreatButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ThreatButton({ active, onClick, icon, label }: ThreatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-300 text-xs font-ui h-12",
        active
          ? "bg-red-500/20 border-red-500 text-red-400"
          : "bg-card/50 border-white/10 text-gray-400 hover:border-white/20"
      )}
    >
      <div className="mb-0.5">{icon}</div>
      <span className="text-[10px] whitespace-nowrap">{label}</span>
    </button>
  );
}
