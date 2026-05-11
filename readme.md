# nova-hooks

A highly-optimized, **zero-configuration** event tracking utility for capturing user interactions and page visits in React applications. Built with a custom, lightweight `EventBus` and `socket.io-client`.

---

## ✨ Features

- **Zero-Config Tracking:** Automatically captures clicks on buttons, links, and interactive elements without needing manual attributes!
- **True Page Dwell Time:** Uses the native Page Visibility API to calculate the *actual* active time spent on a page (pauses when the user switches tabs).
- **Network Optimized:** Employs a built-in 1-second debouncing and click-batching mechanism to minimize network overhead.
- **Ultra-Lightweight:** Zero dependencies (other than `socket.io-client`). Fully framework-agnostic core logic.
- **Auto-Enriched Context:** Automatically attaches `PageUrl`, `PageTitle`, `Project`, and `CreatedDate` to every single event payload.
- **SSR Safe:** Fully compatible with Next.js and Remix.

---

## 🚀 Getting Started

### 1. Install

```bash
yarn add nova-hooks
```

```bash
npm i nova-hooks
```

### 2. Initialization

> [!IMPORTANT]
> Ensure the socket connection is established at the root of your application using the `connectSocket` method.

```tsx
import { connectSocket } from "nova-hooks";
import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    connectSocket(import.meta.env.VITE_APP_SOCKET, "WolfPack");
  }, []);

  // app code...
};
```

---

## 🛠️ Usage Examples

### 1. Zero-Config Global Click Tracking
Place `useGlobalClickTracker` in your authenticated layout. It will automatically listen to the DOM and seamlessly track clicks on any `<button>`, `<a>`, or `cursor: pointer` element!

```tsx
import { useGlobalClickTracker } from "nova-hooks";

const ProtectedLayout = ({ children }) => {
  const { user } = useAuth();
  
  // Magic happens here! Tracks all UI clicks across the entire app.
  useGlobalClickTracker(user?.empId, user?.roleId);

  return <>{children}</>;
};
```
*Note: It will intelligently extract labels from `innerText`, `title`, `aria-label`, or auto-generate a fallback CSS Path!*

### 2. Explicit Tracking (Optional Overrides)
If you want to override the auto-detected name for a specific button, just attach the `data-nova-*` attributes:

```tsx
<button
  data-nova-track-id="Custom Task Action"
  data-nova-track-type={ActionType.Button}
>
  Track Me Specifically
</button>
```

### 3. Accurate Page Dwell Time
Track exactly how long a user actively stares at a specific page/component. The timer pauses if they switch tabs or minimize the browser!

```tsx
import { usePageTimeTracker } from "nova-hooks";

export const Dashboard = () => {
  const { user } = useAuth();

  // Tracks active dwell time and emits it automatically when the user leaves the page
  usePageTimeTracker("Home Dashboard", user?.empId, user?.roleId);

  return <div>Welcome to the Dashboard</div>;
};
```

### 4. Manual / Imperative Tracking
If you need to track events programmatically (like inside an API success callback), use the `withEvent` method:

```tsx
import { withEvent, ActionType } from "nova-hooks";

const doLogin = () => {
  api.login()
    .then(() => {
      withEvent({
        Action: "Login Success",
        ActionType: ActionType.Login,
        EmpId: "EMP-123",
        EmpRole: "Admin",
        Count: 1,
      });
    });
};
```

---

## 📦 Exports & Types

| Name                    | Type                                                         | Description                                                                                            |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `ActionType`            | `object`                                                     | Predefined enum-like values: `"Button"`, `"Menu"`, `"Login"`, `"Link"`                                 |
| `PageVisitAction`       | `string`                                                     | Constant string `"Page Visit"` used for tracking page visits                                           |
| `connectSocket`         | `(socketUrl: string, project: string) => void`               | Connects to the socket server and sets the project name.                                               |
| `disconnectSocket`      | `() => void`                                                 | Disconnects and cleans up the active socket connection.                                                |
| `withEvent`             | `(eventData: EventData, callback?: Function) => void`        | Emits a structured event optionally after running a callback.                                          |
| `useGlobalClickTracker` | `(empId?: string, roleId?: string) => void`                  | React hook to automatically track global click events.                                                 |
| `usePageTimeTracker`    | `(action: string; empId?: string; empRole?: string) => void` | React hook to track active time spent on a page via the Visibility API.                                |

### EventData Structure
All events are automatically enriched with `Project`, `PageUrl`, `PageTitle`, and an ISO `CreatedDate`.

| Property     | Type                                                              | Description                                                         |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ActionType` | `keyof typeof ActionType` \| `typeof PageVisitAction`             | Type of the action.                                                 |
| `Action`     | `string`                                                          | Specific action performed (extracted from DOM or manually set).     |
| `EmpId`      | `string`                                                          | Unique identifier of the employee.                                  |
| `EmpRole`    | `string`                                                          | Role of the employee performing the action.                         |
| `Count`      | `number` _(only when `ActionType` is from `ActionType`)_          | Number of rapid occurrences of the action (batched).                |
| `Duration`   | `number` _(seconds, only when `ActionType` is `PageVisitAction`)_ | Duration of the *active* visit in seconds.                          |
