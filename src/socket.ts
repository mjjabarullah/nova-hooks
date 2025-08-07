import { io } from "socket.io-client";
import { setProjectName } from "./event-bus";

export let socket: ReturnType<typeof io>;

/**
 * Connects to the socket server and emits a connection event
 * @param socketUrl The URL of the socket server to connect to
 */
export const connectSocket = (socketUrl: string, projectName: string) => {
  if (!socket) {
    socket = io(socketUrl);
    setProjectName(projectName);
    socket.on("connect", () => {
      console.log("Nova socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Nova socket disconnected");
    });
  }
};
