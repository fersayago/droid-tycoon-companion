import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DroidTracker } from "@/components/tracker/droid-tracker";

beforeEach(() => {
  window.localStorage.clear();
});

describe("DroidTracker", () => {
  it("updates the requirements table when rebirth changes", () => {
    render(<DroidTracker />);

    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 1" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ruta de reset"), { target: { value: "2" } });

    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 2" })).toBeInTheDocument();
    expect(screen.getAllByText("BASE ID10").length).toBeGreaterThan(0);
  });

  it("recalculates urgency when the current level changes", () => {
    render(<DroidTracker />);

    expect(screen.getAllByText("Necesitás ahora").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Nivel actual"), { target: { value: "2" } });

    const currentLevel = screen.getByText("Nivel 2 → 3").closest("section");
    expect(currentLevel).not.toBeNull();
    expect(within(currentLevel!).getAllByText("Necesitás ahora").length).toBeGreaterThan(0);
  });

  it("hides levels that are already past the current level", () => {
    render(<DroidTracker />);

    fireEvent.change(screen.getByLabelText("Nivel actual"), { target: { value: "2" } });

    expect(screen.queryByText("Nivel 0 → 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel 1 → 2")).not.toBeInTheDocument();
    expect(screen.getByText("Nivel 2 → 3")).toBeInTheDocument();
  });

  it("marks a requirement as covered when a satisfying variant is selected", () => {
    render(<DroidTracker />);

    fireEvent.change(screen.getByPlaceholderText("Buscar droide"), { target: { value: "CB" } });
    fireEvent.click(screen.getByLabelText("CB GOLD"));

    expect(screen.getAllByText("Cubierto").length).toBeGreaterThan(0);
  });

  it("persists inventory in localStorage", () => {
    const { unmount } = render(<DroidTracker />);

    fireEvent.change(screen.getByPlaceholderText("Buscar droide"), { target: { value: "CB" } });
    fireEvent.click(screen.getByLabelText("CB GOLD"));

    unmount();
    render(<DroidTracker />);

    fireEvent.change(screen.getByPlaceholderText("Buscar droide"), { target: { value: "CB" } });
    expect(screen.getByLabelText("CB GOLD")).toBeChecked();
  });
});
