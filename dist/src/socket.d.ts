import { io } from 'socket.io-client';
export declare let socket: ReturnType<typeof io> | undefined;
export declare let projectName: string | number;
/**
 * Connects to the socket server and emits a connection event
 * @param socketUrl The URL of the socket server to connect to
 */
export declare const connectSocket: (socketUrl: string, project: string) => void;
/**
 * Disconnects the socket server and cleans up the instance
 */
export declare const disconnectSocket: () => void;
