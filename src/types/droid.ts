export type DroidRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export type Variant = "BASE" | "GOLD" | "DIAMOND" | "RAINBOW" | "BESKAR" | "FLAWLESS";

export type Rebirth = 1 | 2 | 3 | 4;

export interface Droid {
  id: string;
  name: string;
  rarity: DroidRarity;
  allowedVariants: Variant[];
}

export interface Requirement {
  id: string;
  rebirth: Rebirth;
  fromLevel: number;
  toLevel: number;
  levelLabel: string;
  credits: string;
  droidName: string;
  droidId: string;
  requiredRarity: DroidRarity;
  requiredVariant: Variant;
}

export type Inventory = Record<string, Variant | undefined>;

export interface InventoryState {
  selectedRebirth: Rebirth;
  currentLevel: number;
  inventory: Inventory;
}

export type RequirementStatus = "covered" | "need-now" | "need-soon" | "need-later" | "past";
export type DroidStatus = "covered" | "need-now" | "need-soon" | "need-later" | "keep" | "sell-candidate" | "neutral";
