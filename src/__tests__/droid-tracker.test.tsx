import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DroidTracker } from "@/components/tracker/droid-tracker";

beforeEach(() => {
  window.localStorage.clear();
});

describe("DroidTracker", () => {
  it("updates the requirements table when rebirth changes", () => {
    render(<DroidTracker />);

    expect(screen.getByRole("heading", { name: "Rebirth 1 requirements" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Reset path"), { target: { value: "2" } });

    expect(screen.getByRole("heading", { name: "Rebirth 2 requirements" })).toBeInTheDocument();
    expect(screen.getAllByText("BASE ID10").length).toBeGreaterThan(0);
  });

  it("recalculates urgency when the current level changes", () => {
    render(<DroidTracker />);

    expect(screen.getAllByText("Need now").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Current level"), { target: { value: "2" } });

    const currentLevel = screen.getByText("Level 2→3").closest("section");
    expect(currentLevel).not.toBeNull();
    expect(within(currentLevel!).getAllByText("Need now").length).toBeGreaterThan(0);
  });

  it("marks a requirement as covered when a satisfying variant is selected", () => {
    render(<DroidTracker />);

    fireEvent.change(screen.getByPlaceholderText("Search droid"), { target: { value: "CB" } });
    fireEvent.click(screen.getByLabelText("CB GOLD"));

    expect(screen.getAllByText("Covered").length).toBeGreaterThan(0);
  });

  it("persists inventory in localStorage", () => {
    const { unmount } = render(<DroidTracker />);

    fireEvent.change(screen.getByPlaceholderText("Search droid"), { target: { value: "CB" } });
    fireEvent.click(screen.getByLabelText("CB GOLD"));

    unmount();
    render(<DroidTracker />);

    fireEvent.change(screen.getByPlaceholderText("Search droid"), { target: { value: "CB" } });
    expect(screen.getByLabelText("CB GOLD")).toBeChecked();
  });
});
