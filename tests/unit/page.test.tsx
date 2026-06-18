import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "@/app/(dashboard)/page";

afterEach(cleanup);

describe("Home", () => {
  it("renders the Phase 2 refund dashboard shell and preserves KPI cards", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /refund operations dashboard/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/typed mock refund data only/i)).toBeTruthy();
    expect(screen.getByText(/total refunded/i)).toBeTruthy();
    expect(screen.getByText(/open refunds/i)).toBeTruthy();
    expect(screen.getAllByText(/urgent \/ high risk/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(/interactive refund operations queue/i)).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /rfnd_demo_1001/i,
      }),
    ).toBeTruthy();
    expect(screen.getAllByText(/returning customer a/i).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", {
        name: /rfnd_demo_1001/i,
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: /close refund detail panel/i,
      }),
    ).toBeNull();
  });

  it("searches and filters visible refund rows", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/search refunds/i), {
      target: { value: "ord-1042" },
    });

    expect(screen.getAllByText(/guest checkout b/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/returning customer a/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    fireEvent.change(screen.getByLabelText(/status filter/i), {
      target: { value: "pending_review" },
    });
    fireEvent.change(screen.getByLabelText(/channel filter/i), {
      target: { value: "Stripe test" },
    });

    expect(
      screen.getAllByText(/subscription shopper e/i).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/guest checkout b/i)).toBeNull();
  });

  it("filters urgent and high-risk refunds with the risk filter", () => {
    render(<Home />);

    const riskFilter = screen.getByLabelText(/risk filter/i);

    expect(screen.getByRole("option", { name: /^all$/i })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: /urgent \/ high risk/i }),
    ).toBeTruthy();

    fireEvent.change(riskFilter, {
      target: { value: "urgent-high-risk" },
    });

    expect((riskFilter as HTMLSelectElement).value).toBe("urgent-high-risk");
    expect(screen.getByText(/showing 3 of 7 refund records/i)).toBeTruthy();
    expect(
      screen.getAllByText(/returning customer a/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/wholesale buyer c/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/subscription shopper e/i).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/guest checkout b/i)).toBeNull();
    expect(screen.queryByText(/loyalty member d/i)).toBeNull();
  });

  it("sorts visible refund rows by amount", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/sort refund table/i), {
      target: { value: "amount-desc" },
    });

    const refundButtons = screen.getAllByRole("button", {
      name: /rfnd_demo_/i,
    });

    expect(refundButtons[0]?.textContent).toContain("rfnd_demo_1003");
  });

  it("shows an empty state and can clear filters", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/search refunds/i), {
      target: { value: "not-a-real-refund" },
    });

    expect(
      screen.getByText(/no refunds match the current filters/i),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getAllByText(/rfnd_demo_1001/i).length).toBeGreaterThan(0);
  });

  it("updates the selected refund detail panel and preserves it while sorting", () => {
    render(<Home />);

    expect(
      screen.queryByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: /rfnd_demo_1003/i,
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: /rfnd_demo_1003/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getAllByText(/large partial refund needs finance review/i).length,
    ).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/sort refund table/i), {
      target: { value: "created-asc" },
    });

    expect(
      screen.getByRole("heading", {
        name: /rfnd_demo_1003/i,
      }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: /rfnd_demo_1001/i,
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: /rfnd_demo_1001/i,
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", {
        name: /rfnd_demo_1003/i,
      }),
    ).toBeNull();
  });

  it("closes the selected refund detail panel with X and does not reopen it from table controls", () => {
    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /rfnd_demo_1005/i,
      }),
    );

    expect(
      screen.getByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeTruthy();

    const closeButton = screen.getByRole("button", {
      name: /close refund detail panel/i,
    });

    fireEvent.click(closeButton);

    expect(
      screen.queryByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeNull();

    fireEvent.change(screen.getByLabelText(/sort refund table/i), {
      target: { value: "amount-desc" },
    });
    fireEvent.change(screen.getByLabelText(/risk filter/i), {
      target: { value: "urgent-high-risk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(
      screen.queryByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeNull();
  });

  it("hides the selected refund detail panel when filters remove the selected row", async () => {
    render(<Home />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /rfnd_demo_1003/i,
      }),
    );

    expect(
      screen.getByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/search refunds/i), {
      target: { value: "ord-1042" },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", {
          name: /selected refund detail/i,
        }),
      ).toBeNull();
    });
    expect(
      screen.queryByRole("heading", {
        name: /rfnd_demo_1003/i,
      }),
    ).toBeNull();
  });

  it("exposes refund row actions with detail state and returns focus after closing", () => {
    render(<Home />);

    const refundButton = screen.getByRole("button", {
      name: /view details for refund rfnd_demo_1001, order ord-1048, returning customer a/i,
    });

    expect(refundButton.getAttribute("aria-expanded")).toBe("false");
    expect(refundButton.getAttribute("aria-controls")).toBeNull();

    fireEvent.click(refundButton);

    expect(refundButton.getAttribute("aria-expanded")).toBe("true");
    expect(refundButton.getAttribute("aria-controls")).toBe(
      "selected-refund-detail",
    );
    expect(
      screen.getByRole("complementary", {
        name: /selected refund detail/i,
      }).getAttribute("id"),
    ).toBe("selected-refund-detail");

    const closeButton = screen.getByRole("button", {
      name: /close refund detail panel/i,
    });

    fireEvent.click(closeButton);

    expect(
      screen.queryByRole("complementary", {
        name: /selected refund detail/i,
      }),
    ).toBeNull();
    expect(document.activeElement).toBe(refundButton);
  });
});
