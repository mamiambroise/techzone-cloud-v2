import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WidgetBody } from "./DashboardWidgets.jsx";
import {
  effectiveNavigation,
  activeNavigation,
} from "../../app/navigationConfig.js";
import { canAccess } from "../../app/navigationAccess.js";
afterEach(cleanup);
describe("Effective navigation", () => {
  it("fails closed before IAM and tenant are ready", () => {
    expect(effectiveNavigation(null, { tenantId: "a" })).toEqual([]);
    expect(
      effectiveNavigation({ permissions: ["*"] }, { loading: true }).map(
        (g) => g.id,
      ),
    ).toEqual(["dashboard"]);
  });
  it("does not infer permission from a display role", () => {
    expect(canAccess({ permission: "pack.read" }, { isAdmin: true })).toBe(
      false,
    );
  });
  it("filters modules for a runtime operator", () => {
    const groups = effectiveNavigation(
      { permissions: ["runtime.resolution.read"] },
      { tenantId: "a" },
    );
    expect(groups.some((g) => g.id === "runtime")).toBe(true);
    expect(groups.some((g) => g.id === "packs")).toBe(false);
    expect(groups.some((g) => g.id === "iam")).toBe(false);
  });
  it("keeps one Runtime and one Data domain and places Registry on the platform", () => {
    const groups = effectiveNavigation(
      { permissions: ["*"] },
      { tenantId: "a" },
    );
    expect(groups.filter((g) => g.id === "runtime")).toHaveLength(1);
    expect(groups.find((g) => g.id === "registry").section).toBe("platform");
    expect(
      groups
        .find((g) => g.id === "packs")
        .entries.some((e) => e.label.includes("Runtime")),
    ).toBe(false);
  });
  it("maps deep business routes to the correct child", () => {
    expect(
      activeNavigation("/business-manager/applications/a/versions/v/validation")
        .id,
    ).toBe("bmQuality");
  });
});
describe("Dashboard states", () => {
  const show = (widget, props = {}) =>
    render(
      <MemoryRouter>
        <WidgetBody widget={widget} empty="Aucune donnée" {...props}>
          {(value) => <p>Valeur {value}</p>}
        </WidgetBody>
      </MemoryRouter>,
    );
  it("renders a true zero", () => {
    show({ state: "LOADED", data: 0 });
    expect(screen.getByText("Valeur 0")).toBeInTheDocument();
  });
  it("distinguishes empty from unavailable", () => {
    show({ state: "EMPTY", data: [] });
    expect(screen.getByText("Aucune donnée")).toBeInTheDocument();
    cleanup();
    show({ state: "UNAVAILABLE", data: null });
    expect(screen.queryByText("Aucune donnée")).not.toBeInTheDocument();
    expect(screen.queryByText(/Valeur/)).not.toBeInTheDocument();
  });
  it("retries only through the widget callback", () => {
    const retry = vi.fn();
    show({ state: "ERROR", data: null }, { retry });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it("does not render forbidden or loading data", () => {
    show({ state: "FORBIDDEN", data: "secret" });
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
    cleanup();
    show({ state: "LOADED", data: 123 }, { loading: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/123/)).not.toBeInTheDocument();
  });
});
