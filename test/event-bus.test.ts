import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withEvent, ActionType, PageVisitAction } from "../src/event-bus";
import { connectSocket, socket } from "../src/socket";

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe("event-bus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    connectSocket("http://test.com", "TestProject");
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should batch rapid click events within 1 second", () => {
    const emitSpy = vi.spyOn(socket!, "emit");

    withEvent({
      Action: "Submit",
      ActionType: ActionType.Button,
      EmpId: "E1",
      EmpRole: "R1",
      Count: 1,
    });

    withEvent({
      Action: "Submit",
      ActionType: ActionType.Button,
      EmpId: "E1",
      EmpRole: "R1",
      Count: 1,
    });

    expect(emitSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    const args = emitSpy.mock.calls[0];
    expect(args[0]).toBe("nova-user-activity");
    expect(args[1].Count).toBe(2);
    expect(args[1].Action).toBe("Submit");
  });

  it("should emit PageVisitAction immediately", () => {
    const emitSpy = vi.spyOn(socket!, "emit");

    withEvent({
      Action: "Dashboard",
      ActionType: PageVisitAction,
      EmpId: "E1",
      EmpRole: "R1",
      Duration: 10,
    });

    expect(emitSpy).toHaveBeenCalledTimes(1);
    const args = emitSpy.mock.calls[0];
    expect(args[1].ActionType).toBe(PageVisitAction);
    expect(args[1].Duration).toBe(10);
  });

  it("should execute callback if provided", () => {
    const callback = vi.fn();
    withEvent({
      Action: "Click",
      ActionType: ActionType.Button,
      EmpId: "E1",
      EmpRole: "R1",
      Count: 1,
    }, callback);

    expect(callback).toHaveBeenCalled();
  });

  it("should catch and log errors during event processing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    // Force an error by making emit throw
    vi.spyOn(socket!, "emit").mockImplementation(() => {
      throw new Error("Simulated Error");
    });

    withEvent({
      Action: "Error Trigger",
      ActionType: PageVisitAction,
      EmpId: "E1",
      EmpRole: "R1",
      Duration: 1,
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
