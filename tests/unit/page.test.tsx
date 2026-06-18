import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/(dashboard)/page";

describe("Home", () => {
  it("renders the Phase 1 refund dashboard shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /refund operations dashboard/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/typed mock refund data only/i)).toBeTruthy();
    expect(screen.getByText(/total refunded/i)).toBeTruthy();
    expect(screen.getByText(/open refunds/i)).toBeTruthy();
    expect(screen.getByText(/urgent \/ high risk/i)).toBeTruthy();
    expect(screen.getByText(/refund operations queue/i)).toBeTruthy();
    expect(screen.getByText(/rfnd_demo_1001/i)).toBeTruthy();
    expect(screen.getByText(/returning customer a/i)).toBeTruthy();
  });
});
