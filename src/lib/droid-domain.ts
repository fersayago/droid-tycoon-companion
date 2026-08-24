import { droids, requirements } from "@/data/droidex";
import type { Droid, DroidStatus, Inventory, Rebirth, Requirement, RequirementStatus, Variant } from "@/types/droid";

export const variantOrder: Variant[] = ["BASE", "GOLD", "DIAMOND", "RAINBOW", "BESKAR", "GALACTIC", "STELLAR", "FLAWLESS"];
export const allVariants: Variant[] = [...variantOrder];

export const rarityOrder = ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"] as const;

export function normalizeVariant(value: string): Variant {
  const normalized = value.trim().toUpperCase();
  if (normalized === "BASIC" || normalized === "DEFAULT") return "BASE";
  if (allVariants.includes(normalized as Variant)) return normalized as Variant;
  return "BASE";
}

export function variantRank(variant: Variant): number {
  return variantOrder.indexOf(variant);
}

export function variantSatisfies(owned: Variant | undefined, required: Variant): boolean {
  if (!owned) return false;
  return variantRank(owned) >= variantRank(required);
}

export function hasRequirement(inventory: Inventory, requirement: Requirement): boolean {
  return variantSatisfies(inventory[requirement.droidId], requirement.requiredVariant);
}

export function getRequirementsForRebirth(rebirth: Rebirth): Requirement[] {
  return requirements.filter((requirement) => requirement.rebirth === rebirth);
}

export function getRemainingRequirements(rebirth: Rebirth, currentLevel: number): Requirement[] {
  return getRequirementsForRebirth(rebirth).filter((requirement) => requirement.fromLevel >= currentLevel);
}

export function getRequirementStatus(requirement: Requirement, inventory: Inventory, currentLevel: number): RequirementStatus {
  if (requirement.fromLevel < currentLevel) return "past";
  if (hasRequirement(inventory, requirement)) return "covered";
  if (requirement.fromLevel === currentLevel) return "need-now";
  if (requirement.fromLevel <= currentLevel + 3) return "need-soon";
  return "need-later";
}

export function getDroidStatus(droid: Droid, inventory: Inventory, rebirth: Rebirth, currentLevel: number): DroidStatus {
  const ownedVariant = inventory[droid.id];
  const futureRequirements = getRemainingRequirements(rebirth, currentLevel).filter((requirement) => requirement.droidId === droid.id);

  if (futureRequirements.length === 0) {
    return ownedVariant ? "sell-candidate" : "neutral";
  }

  const openRequirementStatuses = futureRequirements.map((requirement) => getRequirementStatus(requirement, inventory, currentLevel));
  if (openRequirementStatuses.includes("need-now")) return "need-now";
  if (openRequirementStatuses.includes("need-soon")) return "need-soon";
  if (openRequirementStatuses.includes("need-later")) return "need-later";
  if (ownedVariant) return "keep";
  return "covered";
}

export function setOwnedVariant(inventory: Inventory, droidId: string, variant: Variant | undefined): Inventory {
  const updated = { ...inventory };
  if (!variant) {
    delete updated[droidId];
  } else {
    updated[droidId] = variant;
  }
  return updated;
}

export function groupRequirementsByLevel(items: Requirement[]): Array<{ fromLevel: number; toLevel: number; label: string; credits: string; requirements: Requirement[] }> {
  const groups = new Map<number, { fromLevel: number; toLevel: number; label: string; credits: string; requirements: Requirement[] }>();
  for (const requirement of items) {
    const existing = groups.get(requirement.fromLevel);
    if (existing) {
      existing.requirements.push(requirement);
    } else {
      groups.set(requirement.fromLevel, {
        fromLevel: requirement.fromLevel,
        toLevel: requirement.toLevel,
        label: requirement.levelLabel,
        credits: requirement.credits,
        requirements: [requirement],
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.fromLevel - b.fromLevel);
}

export function getNextRequirementForDroid(requirement: Requirement, rebirth: Rebirth): Requirement | undefined {
  return getRequirementsForRebirth(rebirth)
    .filter((candidate) => candidate.droidId === requirement.droidId && candidate.fromLevel > requirement.fromLevel)
    .sort((a, b) => a.fromLevel - b.fromLevel)[0];
}

export const droidById = new Map(droids.map((droid) => [droid.id, droid]));
