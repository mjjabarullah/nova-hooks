# AI Agent Instructions for `nova-hooks`

Welcome! If you are an AI agent working on this repository, please review this document to understand the project's purpose, structure, and constraints.

## Project Overview
`nova-hooks` is a lightweight, zero-configuration event tracking utility for React applications. It captures user activities like button clicks, form submissions, and page visits, and streams them in real-time to a socket server using `socket.io-client`.

## Tech Stack
- **Language:** TypeScript
- **UI Framework:** React (peer dependency only, hooks-based)
- **Networking:** Socket.IO Client
- **Event Management:** Node.js `events` module (`EventEmitter`)
- **Build Tool:** Vite (with `vite-plugin-dts` for declaration files)

## Project Structure
- `src/socket.ts`: Manages the singleton Socket.IO connection and global project state.
- `src/event-bus.ts`: Central nervous system of the library. Uses `EventEmitter` to decouple React components from the socket logic. Enriches raw tracking events with timestamps and project identifiers before network transmission.
- `src/hooks.ts`: React hooks (`useGlobalClickTracker`, `usePageTimeTracker`) that integrate with the DOM and React lifecycle to capture user activities.
- `src/index.ts`: Public API barrel file.

## Development Constraints & Guidelines
1. **Keep it Lightweight:** This library is meant to be a low-overhead tracker. Do not introduce heavy dependencies (e.g., Lodash, Moment.js). Use native browser APIs and minimal Polyfills.
2. **React Agnosticism:** While it targets React, core logic (`event-bus.ts`, `socket.ts`) should remain framework-agnostic. Only React-specific code should live in `src/hooks.ts`.
3. **Type Safety:** Ensure all newly introduced event types and structures are properly typed within `EventData` and `ActionType`.
4. **DOM Event Delegation:** Use event delegation (like in `useGlobalClickTracker`) rather than attaching listeners to individual elements to maintain high performance in consumer applications.
5. **Singleton Socket:** Assume only one socket connection will be active per application session. Use the existing global `socket` instance.

## Testing & Building
- To build the library: `npm run build`
- Currently, there is no extensive test suite configured. When adding one, prefer lightweight runners (like Vitest).
