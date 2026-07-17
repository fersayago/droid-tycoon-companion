"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Plus, Search, SlidersHorizontal, Sun, Trash2, X } from "lucide-react";
import { droids, maxLevel, rebirths } from "@/data/droidex";
import {
  droidById,
  getDroidStatus,
  getNextRequirementForDroid,
  getRequirementStatus,
  getRequirementsForRebirth,
  groupRequirementsByLevel,
  hasRequirement,
  rarityOrder,
  setOwnedVariant,
  variantOrder,
  variantSatisfies,
} from "@/lib/droid-domain";
import type { DroidRarity, DroidStatus, Inventory, InventoryState, Rebirth, Requirement, RequirementStatus, Variant } from "@/types/droid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const storageKey = "droid-tycoon-companion:v1";
const themeStorageKey = "droid-tycoon-companion:theme";

const defaultState: InventoryState = {
  selectedRebirth: 1,
  currentLevel: 0,
  inventory: {},
};

const statusLabels: Record<DroidStatus | RequirementStatus, string> = {
  covered: "Covered",
  "need-now": "Need now",
  "need-soon": "Need soon",
  "need-later": "Need later",
  keep: "Keep",
  "sell-candidate": "Sell candidate",
  neutral: "Neutral",
  past: "Past",
};

const statusClasses: Record<DroidStatus | RequirementStatus, string> = {
  covered: "border-emerald-600 bg-emerald-500 text-emerald-950 shadow-sm shadow-emerald-950/20",
  "need-now": "border-red-700 bg-red-600 text-white shadow-sm shadow-red-950/30",
  "need-soon": "border-orange-700 bg-orange-500 text-orange-950 shadow-sm shadow-orange-950/20",
  "need-later": "border-sky-700 bg-sky-500 text-sky-950 shadow-sm shadow-sky-950/20",
  keep: "border-violet-700 bg-violet-500 text-white shadow-sm shadow-violet-950/20",
  "sell-candidate": "border-slate-600 bg-slate-300 text-slate-950 shadow-sm shadow-slate-950/10",
  neutral: "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
  past: "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const rowStatusClasses: Record<DroidStatus | RequirementStatus, string> = {
  covered: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
  "need-now": "border-red-400 bg-red-50 ring-2 ring-red-200 dark:border-red-800 dark:bg-red-950/40 dark:ring-red-900",
  "need-soon": "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40",
  "need-later": "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40",
  keep: "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40",
  "sell-candidate": "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800",
  neutral: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
  past: "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900",
};

const rarityClasses: Record<DroidRarity, string> = {
  COMMON: "text-slate-700 dark:text-slate-300",
  RARE: "text-blue-700 dark:text-blue-300",
  EPIC: "text-purple-700 dark:text-purple-300",
  LEGENDARY: "text-amber-700 dark:text-amber-300",
  MYTHIC: "text-red-700 dark:text-red-300",
};

function normalizeLoadedInventory(rawInventory: unknown): Inventory {
  if (!rawInventory || typeof rawInventory !== "object") return {};
  const next: Inventory = {};
  for (const [droidId, value] of Object.entries(rawInventory as Record<string, unknown>)) {
    if (typeof value === "string" && variantOrder.includes(value as Variant)) {
      next[droidId] = value as Variant;
      continue;
    }
    if (Array.isArray(value)) {
      const variants = value.filter((candidate): candidate is Variant => typeof candidate === "string" && variantOrder.includes(candidate as Variant));
      const highest = variants.sort((a, b) => variantOrder.indexOf(b) - variantOrder.indexOf(a))[0];
      if (highest) next[droidId] = highest;
    }
  }
  return next;
}

function safeLoadState(): InventoryState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<InventoryState>;
    return {
      selectedRebirth: parsed.selectedRebirth ?? defaultState.selectedRebirth,
      currentLevel: parsed.currentLevel ?? defaultState.currentLevel,
      inventory: normalizeLoadedInventory(parsed.inventory),
    };
  } catch {
    return defaultState;
  }
}

function StatusBadge({ status }: { status: DroidStatus | RequirementStatus }) {
  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", statusClasses[status])}>{statusLabels[status]}</span>;
}

export function DroidTracker() {
  const [state, setState] = useState<InventoryState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState<DroidRarity | "ALL">("ALL");
  const [status, setStatus] = useState<DroidStatus | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(true);
  const [neededForResetOnly, setNeededForResetOnly] = useState(true);
  const [currentLevelOrHigherOnly, setCurrentLevelOrHigherOnly] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [highlightedDroidId, setHighlightedDroidId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setState(safeLoadState());
    setDarkMode(window.localStorage.getItem(themeStorageKey) === "dark");
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    if (hydrated) window.localStorage.setItem(themeStorageKey, darkMode ? "dark" : "light");
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state]);

  const rebirthRequirements = useMemo(() => getRequirementsForRebirth(state.selectedRebirth), [state.selectedRebirth]);
  const levelGroups = useMemo(
    () => groupRequirementsByLevel(rebirthRequirements).filter((group) => group.fromLevel >= state.currentLevel),
    [rebirthRequirements, state.currentLevel],
  );

  const filteredDroids = useMemo(() => {
    const query = search.trim().toLowerCase();
    return droids.filter((droid) => {
      const droidStatus = getDroidStatus(droid, state.inventory, state.selectedRebirth, state.currentLevel);
      const owned = Boolean(state.inventory[droid.id]);
      const resetRequirements = getRequirementsForRebirth(state.selectedRebirth).filter((requirement) => requirement.droidId === droid.id);
      const belongsToReset = resetRequirements.length > 0;
      const belongsToCurrentLevelOrHigher = resetRequirements.some((requirement) => requirement.fromLevel >= state.currentLevel);
      return (
        (!query || droid.name.toLowerCase().includes(query)) &&
        (rarity === "ALL" || droid.rarity === rarity) &&
        (status === "ALL" || droidStatus === status) &&
        (!neededForResetOnly || owned || (currentLevelOrHigherOnly ? belongsToCurrentLevelOrHigher : belongsToReset))
      );
    });
  }, [currentLevelOrHigherOnly, neededForResetOnly, rarity, search, state.currentLevel, state.inventory, state.selectedRebirth, status]);

  useEffect(() => {
    if (!highlightedDroidId) return;
    const row = Array.from(document.querySelectorAll<HTMLElement>("tr[data-droid-id]")).find((element) => element.dataset.droidId === highlightedDroidId);
    row?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [highlightedDroidId]);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
  }, []);

  const stats = useMemo(() => {
    const remaining = rebirthRequirements.filter((requirement) => requirement.fromLevel >= state.currentLevel);
    const covered = remaining.filter((requirement) => hasRequirement(state.inventory, requirement)).length;
    const needNow = remaining.filter((requirement) => getRequirementStatus(requirement, state.inventory, state.currentLevel) === "need-now").length;
    const ownedCount = Object.values(state.inventory).filter(Boolean).length;
    return { remaining: remaining.length, covered, needNow, ownedCount };
  }, [rebirthRequirements, state.currentLevel, state.inventory]);

  function patchState(patch: Partial<InventoryState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function resetLocalData() {
    window.localStorage.removeItem(storageKey);
    setState(defaultState);
  }

  function handleVariantChange(droidId: string, variant: Variant | undefined) {
    setState((current) => ({ ...current, inventory: setOwnedVariant(current.inventory, droidId, variant) }));
  }

  function highlightDroid(droidId: string) {
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
    setHighlightedDroidId(droidId);
    highlightTimeoutRef.current = window.setTimeout(() => setHighlightedDroidId(null), 2000);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100 md:px-8">
      <div className="mx-auto flex max-w-[1900px] flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 w-fit">Fortnite Droid Tycoon</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Droid Tycoon Companion</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Marcá la variante máxima de cada droide, elegí tu reset y nivel actual, y priorizá qué buscar, qué guardar y qué vender.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px] lg:grid-cols-4">
            <Button
              type="button"
              variant="secondary"
              className="gap-2 sm:col-span-2 lg:col-span-1"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? "Light mode" : "Dark mode"}
            </Button>
            <label htmlFor="selected-rebirth" className="text-sm font-medium">
              Reset path
              <Select id="selected-rebirth" value={String(state.selectedRebirth)} onChange={(event) => patchState({ selectedRebirth: Number(event.target.value) as Rebirth })} className="mt-1 bg-white dark:bg-slate-800">
                {rebirths.map((rebirth) => <option key={rebirth} value={rebirth}>Rebirth {rebirth}</option>)}
              </Select>
            </label>
            <label htmlFor="current-level" className="text-sm font-medium">
              <span className="flex items-center justify-between gap-2">
                Current level
                <button
                  type="button"
                  title="Subir un nivel"
                  aria-label="Subir un nivel"
                  disabled={state.currentLevel >= maxLevel - 1}
                  onClick={() => patchState({ currentLevel: Math.min(state.currentLevel + 1, maxLevel - 1) })}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </span>
              <div className="mt-1 flex gap-2">
                <Select id="current-level" value={String(state.currentLevel)} onChange={(event) => patchState({ currentLevel: Number(event.target.value) })} className="bg-white dark:bg-slate-800">
                  {Array.from({ length: maxLevel }, (_, level) => <option key={level} value={level}>{level} → {level + 1}</option>)}
                </Select>
              </div>
            </label>
            <div className="flex items-end">
              <Button variant="destructive" className="w-full gap-2" onClick={resetLocalData}><Trash2 className="h-4 w-4" /> Reset local data</Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Owned droids" value={stats.ownedCount} />
          <StatCard label="Remaining reqs" value={stats.remaining} />
          <StatCard label="Covered reqs" value={`${stats.covered}/${stats.remaining}`} />
          <StatCard label="Need now" value={stats.needNow} urgent={stats.needNow > 0} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(720px,1fr)_minmax(700px,1fr)]">
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Your Droidex</CardTitle>
                <Button type="button" variant="secondary" className="h-8 gap-2 px-2.5 text-xs" onClick={() => setShowFilters((current) => !current)}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </Button>
              </div>
              <CardDescription>Una fila por droide y una columna por variante. Marcá solo la variante máxima que tenés.</CardDescription>
              {showFilters && <div className="grid gap-3 pt-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm font-medium md:col-span-3">
                  <input type="checkbox" checked={neededForResetOnly} onChange={(event) => setNeededForResetOnly(event.target.checked)} className="h-4 w-4 accent-slate-900" />
                  Solo droids necesarios en este reset
                </label>
                <label className={cn("flex items-center gap-2 text-sm font-medium md:col-span-3", !neededForResetOnly && "opacity-50")}>
                  <input type="checkbox" checked={currentLevelOrHigherOnly} disabled={!neededForResetOnly} onChange={(event) => setCurrentLevelOrHigherOnly(event.target.checked)} className="h-4 w-4 accent-slate-900" />
                  Desde mi nivel en adelante
                </label>
                <label className="relative md:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search droid" className="bg-white pl-9 dark:bg-slate-800" />
                </label>
                <Select value={rarity} onChange={(event) => setRarity(event.target.value as DroidRarity | "ALL")} className="bg-white dark:bg-slate-800">
                  <option value="ALL">All rarities</option>
                  {rarityOrder.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={status} onChange={(event) => setStatus(event.target.value as DroidStatus | "ALL")} className="bg-white dark:bg-slate-800">
                  <option value="ALL">All statuses</option>
                  {(["need-now", "need-soon", "need-later", "keep", "sell-candidate", "covered", "neutral"] as DroidStatus[]).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
                </Select>
              </div>}
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-260px)] overflow-auto p-0">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-700">Droid</th>
                    <th className="border-b border-slate-200 px-3 py-3 text-left dark:border-slate-700">Status</th>
                    {variantOrder.map((variant) => <th key={variant} className="border-b border-slate-200 px-2 py-3 text-center dark:border-slate-700">{variant}</th>)}
                    <th className="border-b border-slate-200 px-2 py-3 text-center dark:border-slate-700">Clear</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDroids.map((droid) => {
                    const droidStatus = getDroidStatus(droid, state.inventory, state.selectedRebirth, state.currentLevel);
                    const owned = state.inventory[droid.id];
                    return (
                      <tr key={droid.id} data-droid-id={droid.id} className={cn("border-b transition-shadow", rowStatusClasses[droidStatus], highlightedDroidId === droid.id && "relative z-10 ring-4 ring-amber-300 ring-inset dark:ring-amber-500")}>
                        <td className="px-4 py-3 align-middle">
                          <p className={cn("font-bold", rarityClasses[droid.rarity])}>{droid.name}</p>
                          <p className="text-xs text-slate-500">{droid.rarity}</p>
                        </td>
                        <td className="px-3 py-3 align-middle"><StatusBadge status={droidStatus} /></td>
                        {variantOrder.map((variant) => (
                          <td key={variant} className="px-2 py-3 text-center align-middle">
                            <input
                              type="radio"
                              name={`variant-${droid.id}`}
                              checked={owned === variant}
                              onChange={() => handleVariantChange(droid.id, variant)}
                              aria-label={`${droid.name} ${variant}`}
                              className="h-4 w-4 accent-slate-900"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleVariantChange(droid.id, undefined)}
                            aria-label={`Clear ${droid.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Rebirth {state.selectedRebirth} requirements</CardTitle>
              <CardDescription>Ahora muestra requisito, rareza, variante propia, cobertura y próxima aparición del mismo droide.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-260px)] overflow-auto pr-2">
              <div className="space-y-3">
                {levelGroups.map((group) => {
                  const isCurrent = group.fromLevel === state.currentLevel;
                  const isPast = group.fromLevel < state.currentLevel;
                  const coveredCount = group.requirements.filter((requirement) => hasRequirement(state.inventory, requirement)).length;
                  return (
                    <section key={group.fromLevel} className={cn("rounded-xl border p-4", isCurrent ? "border-red-400 bg-red-50 ring-2 ring-red-100 dark:border-red-800 dark:bg-red-950/40 dark:ring-red-900" : isPast ? rowStatusClasses.past : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900")}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold">Level {group.label}</h3>
                          <p className="text-xs text-slate-500">Credits: {group.credits} · Covered: {coveredCount}/{group.requirements.length}</p>
                        </div>
                        {isCurrent && <Badge>Current</Badge>}
                      </div>
                      <div className="grid gap-2">
                        {group.requirements.map((requirement) => (
                          <RequirementRow
                            key={requirement.id}
                            requirement={requirement}
                            inventory={state.inventory}
                            currentLevel={state.currentLevel}
                            rebirth={state.selectedRebirth}
                            onDroidClick={highlightDroid}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function RequirementRow({ requirement, inventory, currentLevel, rebirth, onDroidClick }: { requirement: Requirement; inventory: Inventory; currentLevel: number; rebirth: Rebirth; onDroidClick: (droidId: string) => void }) {
  const reqStatus = getRequirementStatus(requirement, inventory, currentLevel);
  const ownedVariant = inventory[requirement.droidId];
  const covers = variantSatisfies(ownedVariant, requirement.requiredVariant);
  const nextRequirement = getNextRequirementForDroid(requirement, rebirth);
  const droid = droidById.get(requirement.droidId);

  return (
    <div className="p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" className="text-left font-bold underline decoration-dotted underline-offset-4 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => onDroidClick(requirement.droidId)} title="Ubicar en Your Droidex">
            {requirement.requiredVariant} {requirement.droidName}
          </button>
          <p className="text-xs text-slate-600">Required rarity: {requirement.requiredRarity}{droid ? ` · Droidex rarity: ${droid.rarity}` : ""}</p>
        </div>
        <StatusBadge status={reqStatus} />
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
        <div className="p-2">
          <dt className="font-semibold uppercase tracking-wide text-slate-500">You have</dt>
          <dd className="font-bold">{ownedVariant ?? "Missing"}</dd>
        </div>
        <div className="p-2">
          <dt className="font-semibold uppercase tracking-wide text-slate-500">Coverage</dt>
          <dd className="font-bold">{covers ? "Variant covers requirement" : "Need this or higher"}</dd>
        </div>
        <div className="p-2">
          <dt className="font-semibold uppercase tracking-wide text-slate-500">Next use</dt>
          <dd className="font-bold">{nextRequirement ? `Level ${nextRequirement.levelLabel} · ${nextRequirement.requiredVariant}` : "No later use in this reset"}</dd>
        </div>
      </dl>
    </div>
  );
}

function StatCard({ label, value, urgent = false }: { label: string; value: number | string; urgent?: boolean }) {
  return (
    <Card className={cn("border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900", urgent && "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/40")}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}
