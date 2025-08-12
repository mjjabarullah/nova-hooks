import { io } from 'socket.io-client';
export declare let socket: ReturnType<typeof io>;
export declare let projectName: string | number;
/**
 * Connects to the socket server and emits a connection event
 * @param socketUrl The URL of the socket server to connect to
 */
export declare const connectSocket: (socketUrl: string, project: string) => void;
