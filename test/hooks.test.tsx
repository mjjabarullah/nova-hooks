import { renderHook, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useGlobalClickTracker, usePageTimeTracker } from "../src/hooks";
import * as eventBus from "../src/event-bus";
import { PageVisitAction } from "../src/event-bus";

describe("useGlobalClickTracker", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should capture button clicks and trigger withEvent", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");

    renderHook(() => useGlobalClickTracker("EMP123", "ADMIN"));

    const button = document.createElement("button");
    button.innerText = "Submit Form";
    document.body.appendChild(button);

    button.click();

    expect(withEventSpy).toHaveBeenCalledWith({
      Action: "Submit Form",
      ActionType: "Button",
      EmpId: "EMP123",
      EmpRole: "ADMIN",
      Count: 1,
    });

    document.body.removeChild(button);
  });
  
  it("should capture clicks on specific input types and links", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");

    renderHook(() => useGlobalClickTracker());

    // Test a link
    const link = document.createElement("a");
    link.innerText = "Link Text";
    document.body.appendChild(link);
    link.click();
    expect(withEventSpy).toHaveBeenCalledWith(expect.objectContaining({ ActionType: "Link", Action: "Link Text" }));

    // Test an input submit
    const input = document.createElement("input");
    input.type = "submit";
    input.title = "Submit Input Title"; 
    document.body.appendChild(input);
    input.click();
    expect(withEventSpy).toHaveBeenCalledWith(expect.objectContaining({ ActionType: "Button", Action: "Submit Input Title" }));

    document.body.removeChild(link);
    document.body.removeChild(input);
  });

  it("should capture clicks on pointer elements and generate CSS path", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    renderHook(() => useGlobalClickTracker());

    const wrapper = document.createElement("div");
    wrapper.id = "my-wrapper";
    
    const icon = document.createElement("span");
    icon.className = "icon class-name";
    icon.style.cursor = "pointer";
    
    wrapper.appendChild(icon);
    document.body.appendChild(wrapper);

    icon.click();

    expect(withEventSpy).toHaveBeenCalledWith(expect.objectContaining({ 
      ActionType: "Menu", 
      Action: "[UI Path] div#my-wrapper > span.icon.class-name" 
    }));

    document.body.removeChild(wrapper);
  });

  it("should truncate extremely long text", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    renderHook(() => useGlobalClickTracker());

    const btn = document.createElement("button");
    btn.innerText = "A".repeat(100);
    document.body.appendChild(btn);

    btn.click();

    expect(withEventSpy).toHaveBeenCalledWith(expect.objectContaining({ 
      Action: "A".repeat(80) + "..." 
    }));

    document.body.removeChild(btn);
  });

  it("should bubble up to find the closest interactive element", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    renderHook(() => useGlobalClickTracker());

    const btn = document.createElement("button");
    const innerSpan = document.createElement("span");
    innerSpan.innerText = "Inner";
    
    // We add explicit track ID to ensure it bubbles and grabs it
    btn.setAttribute("data-nova-track-id", "Bubbled Action");
    btn.setAttribute("data-nova-track-type", "Button");
    
    btn.appendChild(innerSpan);
    document.body.appendChild(btn);

    innerSpan.click();

    expect(withEventSpy).toHaveBeenCalledWith(expect.objectContaining({ 
      Action: "Bubbled Action",
      ActionType: "Button"
    }));

    document.body.removeChild(btn);
  });

  it("should ignore clicks on non-interactive empty elements", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    renderHook(() => useGlobalClickTracker());
    const div = document.createElement("div");
    document.body.appendChild(div);
    div.click();
    expect(withEventSpy).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });
});

describe("usePageTimeTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should track page time and emit on unmount if duration > 5", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });

    const { unmount } = renderHook(() => usePageTimeTracker("Home", "E1", "R1"));

    vi.advanceTimersByTime(6000);
    unmount();

    expect(withEventSpy).toHaveBeenCalledWith({
      Action: "Home",
      ActionType: PageVisitAction,
      EmpId: "E1",
      EmpRole: "R1",
      Duration: 6,
    });
  });

  it("should pause tracking when tab is hidden", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    
    let visibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      get: () => visibilityState,
      configurable: true
    });

    const { unmount } = renderHook(() => usePageTimeTracker("Home", "E1", "R1"));

    vi.advanceTimersByTime(2000); // 2s active
    
    // Hide tab
    visibilityState = 'hidden';
    document.dispatchEvent(new Event("visibilitychange"));
    
    vi.advanceTimersByTime(10000); // 10s inactive

    // Show tab
    visibilityState = 'visible';
    document.dispatchEvent(new Event("visibilitychange"));

    vi.advanceTimersByTime(4000); // 4s active

    unmount();

    // Total active = 2 + 4 = 6. Greater than 5 threshold.
    expect(withEventSpy).toHaveBeenCalledWith(expect.objectContaining({ Duration: 6 }));
  });

  it("should not emit if duration <= 5", () => {
    const withEventSpy = vi.spyOn(eventBus, "withEvent");
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });

    const { unmount } = renderHook(() => usePageTimeTracker("Home"));

    vi.advanceTimersByTime(4000); // Only 4 seconds
    unmount();

    expect(withEventSpy).not.toHaveBeenCalled();
  });
});
