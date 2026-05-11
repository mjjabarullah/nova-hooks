# Architecture Overview

This document outlines the architectural design and data flow of the `nova-hooks` event tracking library.

## System Design

`nova-hooks` utilizes a decoupled, event-driven architecture designed to minimize performance impact on the host React application while ensuring reliable real-time event delivery.

The library consists of three primary layers:
1. **Presentation/React Layer:** Hooks and utility functions integrated into the host app.
2. **Event Bus Layer:** An internal intermediary that processes and enriches events.
3. **Network Layer:** The socket connection that streams data to the server.

---

## Data Flow

### 1. Event Capture (Presentation Layer)
Events are captured from the user interface via one of three methods:
- **`useGlobalClickTracker`**: Implements event delegation by attaching a single `click` event listener to the `document`. It traverses the DOM upwards to find the closest element with `data-nova-track-id` and `data-nova-track-type` attributes, then dispatches the event.
- **`usePageTimeTracker`**: Hooks into the React component lifecycle. It records the current time on mount and calculates the duration on unmount. If the duration exceeds `DURATION_THRUSHOLD`, it dispatches a page visit event.
- **`withEvent`**: An imperative API allowing developers to trigger custom events (e.g., successful API calls, custom business logic).

### 2. Event Processing (Event Bus Layer)
Once captured, events are published to an internal `EventEmitter` located in `src/event-bus.ts` under the `APP_EVENT` channel.
- **Decoupling:** By using an internal event bus, the UI components do not need to know about the network state or socket logic.
- **Enrichment:** A global listener subscribes to `APP_EVENT`. When an event is received, this listener enriches the payload by appending:
  - `Project`: The globally registered project name.
  - `CreatedDate`: A standardized ISO timestamp of when the event occurred.

### 3. Network Transmission (Network Layer)
After enrichment, the event payload is passed to the Socket.IO client instance (`src/socket.ts`).
- The payload is emitted over the network via the `nova-user-activity` socket event.
- The connection is initialized via `connectSocket`, establishing a singleton connection that persists across the application lifecycle.

---

## Core Components

### `socket.ts`
- **Responsibilities:** Manages the Socket.IO singleton and stores the global `projectName`.
- **API:** Exposes `connectSocket(socketUrl, project)` to initialize the connection.

### `event-bus.ts`
- **Responsibilities:** Central event hub. Contains strongly-typed definitions for tracking payloads (`EventData`, `ActionType`).
- **Mechanism:** Initializes `new EventEmitter()`. Listens for `APP_EVENT` to inject metadata and hand off the payload to Socket.IO.

### `hooks.ts`
- **Responsibilities:** React integration.
- **Hooks:**
  - `useGlobalClickTracker(empId, roleId)`: Global DOM click tracker.
  - `usePageTimeTracker(action, empId, empRole)`: Page dwell time tracker.

## Design Decisions
- **Event Delegation over Inline Listeners:** To prevent memory leaks and keep React renders fast, `useGlobalClickTracker` utilizes native DOM event delegation at the root level instead of wrapping individual React components.
- **Internal Event Emitter:** Provides a buffer/bridge. If the socket logic changes or additional logging is needed, it can be attached to the event bus without modifying the React hooks.
