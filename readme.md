# nova-hooks

A lightweight event tracking utility for capturing user interactions (such as button clicks and page visits) in React or JavaScript applications. Built with `EventEmitter` and `socket.io-client`.

---

## ✨ Features

- Emits structured user activity events
- Supports click and page visit tracking
- Timestamp and project metadata included
- Easily extendable and customizable
- No external analytics service required

---

## 🚀 Getting Started

### 1. Install

```bash
yarn add nova-hooks@https://github.com/mjjabarullah/nova-hooks.git
```

```bash
npm i nova-hooks@https://github.com/mjjabarullah/nova-hooks.git
```

## 📦 Exports
| Name              | Type                                                  | Description                                                          |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `ActionType`      | `object`                                              | Predefined enum-like values: `"Button"`, `"Menu"`, `"Login"`         |
| `PageVisitAction` | `string`                                              | Constant string `"Page Visit"` used for tracking page visits         |
| `setProjectName`  | `(name: string) => void`                              | Sets the global project name used in emitted events                  |
| `withEvent`       | `(eventData: EventData, callback?: Function) => void` | Emits a structured event optionally after running a callback         |
| `EventData`       | `type` (union of two objects)                         | Type definition for tracking click events or page visits (see below) |

