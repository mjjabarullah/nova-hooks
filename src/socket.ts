import { io } from "socket.io-client";

export let socket: ReturnType<typeof io>;

export let projectName: string | number;

/**
 * Connects to the socket server and emits a connection event
 * @param socketUrl The URL of the socket server to connect to
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
