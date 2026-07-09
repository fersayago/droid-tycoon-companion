import { describe, expect, it } from "vitest";
import { droids, requirements } from "@/data/droidex";
import {
  getDroidStatus,
  getRequirementStatus,
  hasRequirement,
  normalizeVariant,
  setOwnedVariant,
  variantSatisfies,
} from "@/lib/droid-domain";
import type { Inventory } from "@/types/droid";

describe("variant normalization", () => {
  it("maps spreadsheet aliases to app variants", () => {
    expect(normalizeVariant("BASIC")).toBe("BASE");
    expect(normalizeVariant("DEFAULT")).toBe("BASE");
    expect(normalizeVariant("gold")).toBe("GOLD");
    expect(normalizeVariant("flawless")).toBe("FLAWLESS");
  });
});

describe("variant coverage", () => {
  it("allows superior variants to satisfy inferior requirements", () => {
    expect(variantSatisfies("GOLD", "BASE")).toBe(true);
    expect(variantSatisfies("BESKAR", "RAINBOW")).toBe(true);
    expect(variantSatisfies("BASE", "GOLD")).toBe(false);
    expect(variantSatisfies(undefined, "BASE")).toBe(false);
  });

  it("checks requirements against inventory", () => {
    const requirement = requirements.find((item) => item.droidName === "CB" && item.requiredVariant === "BASE");
    expect(requirement).toBeDefined();
    const inventory: Inventory = { cb: "GOLD" };
    expect(hasRequirement(inventory, requirement!)).toBe(true);
  });
});

describe("urgency and droid statuses", () => {
  it("marks current unmet requirements as need now", () => {
    const requirement = requirements.find((item) => item.rebirth === 1 && item.fromLevel === 0)!;
    expect(getRequirementStatus(requirement, {}, 0)).toBe("need-now");
  });

  it("marks near future unmet requirements as need soon", () => {
    const requirement = requirements.find((item) => item.rebirth === 1 && item.fromLevel === 2)!;
    expect(getRequirementStatus(requirement, {}, 0)).toBe("need-soon");
  });

  it("detects sell candidates only when owned and unused in remaining reset levels", () => {
    const mouse = droids.find((droid) => droid.id === "mouse")!;
    const inventory = setOwnedVariant({}, mouse.id, "BASE");
    expect(getDroidStatus(mouse, inventory, 1, 27)).toBe("sell-candidate");
  });
});

describe("source data", () => {
  it("excludes iconic droids and the spreadsheet TOTAL COLLECTED formula row from the tracker table", () => {
    expect(droids.some((droid) => droid.name === "TOTAL COLLECTED")).toBe(false);
    expect(droids.some((droid) => droid.rarity === "ICONIC")).toBe(false);
    expect(droids).toHaveLength(62);
    expect(requirements).toHaveLength(324);
  });
});
