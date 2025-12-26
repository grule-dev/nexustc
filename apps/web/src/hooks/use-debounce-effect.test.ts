import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounceEffect } from "./use-debounce-effect";

describe("useDebounceEffect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls function after timeout", () => {
    const callback = vi.fn();

    renderHook(() => {
      useDebounceEffect(() => callback(), 1000, []);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalled();
  });

  it("succeeds with latest ref pattern", () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ value }) => {
        useDebounceEffect(() => callback(value), 1000, []);
      },
      { initialProps: { value: "initial" } }
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    rerender({ value: "updated" });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("updated");
  });
});
