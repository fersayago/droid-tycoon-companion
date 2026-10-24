import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DroidTracker } from "@/components/tracker/droid-tracker";

function renderExpandedTracker() {
  const result = render(<DroidTracker />);
  fireEvent.click(screen.getByRole("button", { name: /Your Droidex y resumen/ }));
  return result;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("DroidTracker", () => {
  it("starts with the droidex collapsed while keeping requirements visible", () => {
    render(<DroidTracker />);

    expect(screen.getByRole("button", { name: /Your Droidex y resumen/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "Your Droidex" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 1" })).toBeInTheDocument();
  });

  it("updates the requirements table when rebirth changes", () => {
    render(<DroidTracker />);

    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 1" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ruta de reset"), { target: { value: "2" } });

    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 2" })).toBeInTheDocument();
    expect(screen.getAllByText("BASE ID10").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Ruta de reset"), { target: { value: "6" } });
    expect(screen.getByRole("heading", { name: "Requisitos de Rebirth 6" })).toBeInTheDocument();
    expect(screen.getAllByText("BASE GONK").length).toBeGreaterThan(0);
  });

  it("keeps the current level neutral instead of highlighting it in red", () => {
    render(<DroidTracker />);

    const currentLevel = screen.getByText("Nivel 0").closest("section");
    expect(currentLevel).not.toBeNull();
    expect(currentLevel).not.toHaveClass("bg-red-50");
    expect(currentLevel).toHaveClass("bg-slate-50");
  });

  it("hides levels that are already past the current level", () => {
    render(<DroidTracker />);

    fireEvent.change(screen.getByLabelText("Nivel actual"), { target: { value: "2" } });

    expect(screen.queryByText("Nivel 0")).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel 1")).not.toBeInTheDocument();
    expect(screen.getByText("Nivel 2")).toBeInTheDocument();
  });

  it("keeps the requirements column compact", () => {
    render(<DroidTracker />);

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
    expect(screen.getAllByLabelText(/Podés venderlo|Lo volvés a necesitar/).length).toBeGreaterThan(0);
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
