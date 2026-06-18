import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/(dashboard)/page";

describe("Home", () => {
  it("renders the Phase 0 scaffold", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /e-commerce operations dashboard/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/phase 0 foundation/i)).toBeTruthy();
    expect(screen.getByText(/mock-first local development/i)).toBeTruthy();
  });
});
