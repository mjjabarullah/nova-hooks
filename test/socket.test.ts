import { describe, it, expect, vi, beforeEach } from "vitest";
import { connectSocket, disconnectSocket, socket, projectName } from "../src/socket";

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn((event, cb) => cb()), // Instantly trigger connect/disconnect to test console.logs
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

describe("socket", () => {
  beforeEach(() => {
    disconnectSocket();
    vi.clearAllMocks();
  });

  it("should throw error if socket URL is missing", () => {
    expect(() => connectSocket("", "Project")).toThrow("Socket URL is required to connect.");
  });

  it("should throw error if project name is missing", () => {
    expect(() => connectSocket("http://test", "")).toThrow("Project name is required to connect.");
  });

  it("should connect to socket and set project name", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    connectSocket("http://test", "MyProject");
    
    expect(socket).toBeDefined();
    expect(projectName).toBe("MyProject");
    expect(consoleSpy).toHaveBeenCalledWith("Nova socket connected");
    expect(consoleSpy).toHaveBeenCalledWith("Nova socket disconnected");
    
    consoleSpy.mockRestore();
  });

  it("should ignore duplicate connections", () => {
    connectSocket("http://test", "MyProject");
    const existingSocket = socket;
    connectSocket("http://test2", "MyProject2");
    expect(socket).toBe(existingSocket);
  });

  it("should disconnect and clean up socket", () => {
    connectSocket("http://test", "MyProject");
    expect(socket).toBeDefined();
    disconnectSocket();
    expect(socket).toBeUndefined();
  });
});
