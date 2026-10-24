// Code tests for the global graphie store.

import { describe, it, expect, beforeEach } from "vitest";
import { useGraphieStore } from "./store";

describe("useGraphieStore", () => {
  beforeEach(() => {
    useGraphieStore.setState({
      code: "",
      isReady: false,
      title: "Untitled diagram",
      lastError: null,
    });
  });

  it("initializes with empty code and not-ready state", () => {
    const state = useGraphieStore.getState();
    expect(state.code).toBe("");
    expect(state.isReady).toBe(false);
    expect(state.title).toBe("Untitled diagram");
    expect(state.lastError).toBeNull();
  });

  it("sets and reads code", () => {
    useGraphieStore.getState().setCode("plot(x, X_RANGE);");
    expect(useGraphieStore.getState().code).toBe("plot(x, X_RANGE);");
  });

  it("tracks readiness", () => {
    useGraphieStore.getState().setIsReady(true);
    expect(useGraphieStore.getState().isReady).toBe(true);
  });

  it("tracks the document title", () => {
    useGraphieStore.getState().setTitle("My diagram");
    expect(useGraphieStore.getState().title).toBe("My diagram");
  });

  it("tracks the last error", () => {
    useGraphieStore.getState().setLastError("boom");
    expect(useGraphieStore.getState().lastError).toBe("boom");
    useGraphieStore.getState().setLastError(null);
    expect(useGraphieStore.getState().lastError).toBeNull();
  });
});