import { io } from "socket.io-client";

/** 
 * Singleton instance of the Socket.IO client.
 * Kept global to ensure only one connection exists per application lifecycle.
 */
export let socket: ReturnType<typeof io> | undefined;

/**
 * The global identifier for the current application/project.
 * Attached to all emitted events to segregate data in the backend dashboard.
 */
export let projectName: string | number;

/**
 * Initializes and establishes a real-time connection to the Nova socket server.
 * This should typically be called once at the root of the application (e.g., App.tsx).
 * 
 * @param socketUrl The absolute URL of the socket server to connect to
 * @param project The unique identifier or name of the consuming application
 * @throws {Error} If the socketUrl or project name is missing or empty
 */
export const connectSocket = (socketUrl: string, project: string) => {
  if (!socketUrl || socketUrl.trim() === "") {
    throw new Error("Socket URL is required to connect.");
  }

  if (!project || project.trim() === "") {
    throw new Error("Project name is required to connect.");
  }

  if (socket) return;

  socket = io(socketUrl);
  projectName = project;

  socket.on("connect", () => {
    console.log("Nova socket connected");
  });

  socket.on("disconnect", () => {
    console.log("Nova socket disconnected");
  });
};

/**
 * Gracefully disconnects the active socket connection and completely 
 * destroys the local instance, freeing up resources.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};
