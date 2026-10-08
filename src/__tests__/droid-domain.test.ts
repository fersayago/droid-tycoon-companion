import { describe, expect, it } from "vitest";
import { droids, requirements } from "@/data/droidex";
import { getDroidStatus, getRequirementStatus, hasRequirement, normalizeVariant, setOwnedVariant, variantSatisfies } from "@/lib/droid-domain";
import type { Inventory } from "@/types/droid";

describe("variant normalization", () => {
  it("maps spreadsheet aliases to app variants", () => {
    expect(normalizeVariant("BASIC")).toBe("BASE");
    expect(normalizeVariant("DEFAULT")).toBe("BASE");
    expect(normalizeVariant("gold")).toBe("GOLD");
    expect(normalizeVariant("kyber")).toBe("KYBER");
    expect(normalizeVariant("galactic")).toBe("GALACTIC");
    expect(normalizeVariant("stellar")).toBe("STELLAR");
  });
});

describe("variant coverage", () => {
  it("allows superior variants to satisfy inferior requirements", () => {
    expect(variantSatisfies("GOLD", "BASE")).toBe(true);
    expect(variantSatisfies("BESKAR", "RAINBOW")).toBe(true);
    expect(variantSatisfies("STELLAR", "GALACTIC")).toBe(true);
    expect(variantSatisfies("KYBER", "STELLAR")).toBe(true);
    expect(variantSatisfies("STELLAR", "KYBER")).toBe(false);
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
    expect(getDroidStatus(mouse, inventory, 1, 34)).toBe("sell-candidate");
  });
});

describe("source data", () => {
  it("contains five cycles of 40 levels with Galactic, Stellar, and Kyber requirements", () => {
    expect(droids.some((droid) => droid.name === "TOTAL COLLECTED")).toBe(false);
    expect(droids.some((droid) => droid.rarity === "ICONIC")).toBe(false);
    expect(droids).toHaveLength(62);
    expect(requirements).toHaveLength(600);
    expect(new Set(requirements.map((item) => item.rebirth))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(requirements.filter((item) => item.requiredVariant === "GALACTIC")).not.toHaveLength(0);
    expect(requirements.filter((item) => item.requiredVariant === "STELLAR")).not.toHaveLength(0);
    expect(requirements.filter((item) => item.requiredVariant === "KYBER")).not.toHaveLength(0);
    expect(requirements.filter((item) => item.rebirth === 1 && item.fromLevel === 39)).toHaveLength(3);
    expect(requirements.find((item) => item.rebirth === 1 && item.fromLevel === 39)?.credits).toBe("15.00Qa CREDITS");
  });
});
