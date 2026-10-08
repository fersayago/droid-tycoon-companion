import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DroidTracker } from "@/components/tracker/droid-tracker";

function renderExpandedTracker() {
  const result = render(<DroidTracker />);
  fireEvent.click(screen.getByRole("button", { name: /Your Droidex y requisitos/ }));
  return result;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("DroidTracker", () => {
  it("starts with the droidex and requirements section collapsed", () => {
    render(<DroidTracker />);

    expect(screen.getByRole("button", { name: /Your Droidex y requisitos/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "Requisitos de Rebirth 1" })).not.toBeInTheDocument();
  });

  it("updates the requirements table when rebirth changes", () => {
    renderExpandedTracker();

    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 1" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ruta de reset"), { target: { value: "2" } });

    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 2" })).toBeInTheDocument();
    expect(screen.getAllByText("BASE ID10").length).toBeGreaterThan(0);
  });

  it("recalculates urgency when the current level changes", () => {
    renderExpandedTracker();

    expect(screen.getAllByText("Necesitás ahora").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Nivel actual"), { target: { value: "2" } });

    const currentLevel = screen.getByText("Nivel 2 → 3").closest("section");
    expect(currentLevel).not.toBeNull();
    expect(within(currentLevel!).getAllByText("Necesitás ahora").length).toBeGreaterThan(0);
  });

  it("hides levels that are already past the current level", () => {
    renderExpandedTracker();

    fireEvent.change(screen.getByLabelText("Nivel actual"), { target: { value: "2" } });

    expect(screen.queryByText("Nivel 0 → 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel 1 → 2")).not.toBeInTheDocument();
    expect(screen.getByText("Nivel 2 → 3")).toBeInTheDocument();
  });

  it("keeps the requirements column compact", () => {
    renderExpandedTracker();

    expect(screen.queryByRole("button", { name: "Ver próximo faltante" })).not.toBeInTheDocument();
    expect(screen.queryByText("Cobertura")).not.toBeInTheDocument();
    expect(screen.queryByText("Próximo uso")).not.toBeInTheDocument();
    expect(screen.queryByText("Listo para subir a nivel 1")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Siguiente:/)).not.toBeInTheDocument();
  });

  it("does not show owned or requirement-status tracking in the rebirth requirements", () => {
    renderExpandedTracker();

    expect(screen.queryByText("Tenés:")).not.toBeInTheDocument();
    expect(screen.queryByText("Cubierto")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Podés venderlo|Lo volvés a necesitar/).length).toBeGreaterThan(0);
  });

  it("persists inventory in localStorage", () => {
    const { unmount } = renderExpandedTracker();

    fireEvent.change(screen.getByPlaceholderText("Buscar droide"), { target: { value: "CB" } });
    fireEvent.click(screen.getByLabelText("CB GOLD"));

    unmount();
    renderExpandedTracker();

    fireEvent.change(screen.getByPlaceholderText("Buscar droide"), { target: { value: "CB" } });
    expect(screen.getByLabelText("CB GOLD")).toBeChecked();
  });
});
