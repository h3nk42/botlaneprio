import { useMemo, useState } from "react";
import { adcs } from "@/lib/champions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChampionPoolSelectorProps {
  pool: string[];
  onChange: (pool: string[]) => void;
}

export function ChampionPoolSelector({ pool, onChange }: ChampionPoolSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedChamps = useMemo(
    () => adcs.filter(champ => pool.includes(champ.id)),
    [pool]
  );

  const toggleChampion = (id: string) => {
    const exists = pool.includes(id);
    const nextPool = exists ? pool.filter(champId => champId !== id) : [...pool, id];
    onChange(nextPool);
  };

  const clearPool = () => onChange([]);

  return (
    <div className="w-full max-w-6xl mx-auto mb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl border border-primary/30 bg-card/60 backdrop-blur">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-heading uppercase tracking-[0.2em] text-xs">
            <Sparkles className="w-4 h-4" />
            Champion Pool
          </div>
          <p className="text-sm text-gray-300 font-ui">
            Filter recommendations to champions you actually play.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={clearPool}
            disabled={pool.length === 0}
          >
            Clear
          </Button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-between w-56 border-primary/40 bg-card/70 text-white hover:bg-card/90"
              >
                <span className="flex items-center gap-2 truncate">
                  <ChevronsUpDown className="w-4 h-4 opacity-60" />
                  {pool.length > 0 ? `${pool.length} selected` : "Select champions"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0 bg-card border border-primary/30"
              align="end"
            >
              <Command className="bg-transparent">
                <CommandInput placeholder="Search ADC..." className="h-10 text-white" />
                <CommandList className="max-h-80">
                  <CommandEmpty className="text-gray-400 py-4 text-sm">No champion found.</CommandEmpty>
                  <CommandGroup heading="Marksmen" className="text-xs uppercase text-gray-400">
                    {adcs.map((champ) => {
                      const checked = pool.includes(champ.id);
                      return (
                        <CommandItem
                          key={champ.id}
                          value={champ.name}
                          onSelect={() => toggleChampion(champ.id)}
                          className="flex items-center gap-2 text-white cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleChampion(champ.id)}
                            className="h-4 w-4"
                          />
                          <img
                            src={champ.imageSmall}
                            alt={champ.name}
                            className="h-8 w-8 rounded-md object-cover object-top border border-white/10"
                            loading="lazy"
                          />
                          <span className="flex-1 truncate">{champ.name}</span>
                          {checked && <Check className="w-4 h-4 text-primary" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {selectedChamps.length === 0 ? (
          <span className="text-xs text-gray-400 font-ui">
            No pool set — showing all champions.
          </span>
        ) : (
          selectedChamps.map(champ => (
            <Badge
              key={champ.id}
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 flex items-center gap-2"
            >
              <img
                src={champ.imageSmall}
                alt={champ.name}
                className="h-6 w-6 rounded object-cover object-top border border-white/10"
                loading="lazy"
              />
              <span>{champ.name}</span>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
