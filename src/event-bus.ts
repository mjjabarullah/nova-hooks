import { projectName as Project, socket } from "./socket";

// Lightweight custom event emitter to avoid 'events' package dependency
type Listener = (data: any) => void;
/**
 * A lightweight custom event emitter implementation.
 * Created to avoid bundling the bulky Node.js 'events' package.
 */
class SimpleEventEmitter {
  private listeners: Record<string, Listener[]> = {};

  /**
   * Registers a listener callback for a specific event.
   * @param event The name of the event to listen for
   * @param callback The function to execute when the event is emitted
   */
  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  /**
   * Emits an event, triggering all registered listeners synchronously.
   * @param event The name of the event to emit
   * @param data The payload to pass to the listener callbacks
   */
  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

/**
 * Predefined set of UI element types that can be tracked.
 * Used to categorize standard user click interactions.
 */
export const ActionType = {
  Button: "Button",
  Menu: "Menu",
  Login: "Login",
  Link: "Link",
} as const;

/**
 * Constant identifier representing a page dwell time tracking event.
 */
export const PageVisitAction = "Page Visit";

/**
 * Represents the structure of event data that can be emitted
 * Can be either a click event (Button/Menu) with a count
 * or a page visit event with duration in seconds
 */
export type EventData =
  | {
      ActionType: keyof typeof ActionType;
      Action: string;
      EmpId: string;
      EmpRole: string;
      Count: number;
    }
  | {
      ActionType: typeof PageVisitAction;
      Action: string;
      EmpId: string;
      EmpRole: string;
      Duration: number; // in seconds
    };

/**
 * Represents the final structure of an event payload just before it is sent to the server.
 * Extends the base EventData with context-aware metadata like URL, Project, and Timestamp.
 */
type EnrichedEventData = EventData & {
  Project: string | number;
  CreatedDate: string;
  PageUrl: string;
  PageTitle: string;
};

/** Internal event identifier used for routing payloads within the EventBus */
const APP_EVENT = "APP_EVENT";
/** The singleton instance of the event bus */
const eventBus = new SimpleEventEmitter();
/** The socket event name used when streaming data to the backend */
const NOVA_USER_ACTIVITY_EVENT = "nova-user-activity";

/** Map storing aggregated, debounced click events keyed by their unique signature */
const pendingClicks = new Map<string, EnrichedEventData>();
/** Reference to the active batching debounce timer */
let batchTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Event listener for APP_EVENT that processes and enriches event data
 * Adds project name, timestamp, and page context before sending to server
 */
eventBus.on(APP_EVENT, (eventData: EventData) => {
  if (!eventData) return;

  try {
    if (!socket) {
      console.warn(
        "Nova socket is not initialized. Please call connectSocket first.",
      );
      return;
    }

    const pageUrl =
      typeof window !== "undefined" ? window.location.pathname : "Unknown";
    const pageTitle =
      typeof document !== "undefined" ? document.title : "Unknown";

    const enrichedEvent = {
      ...eventData,
      Project,
      CreatedDate: new Date().toISOString().replace("T", " ").replace("Z", ""),
      PageUrl: pageUrl,
      PageTitle: pageTitle,
    } as EnrichedEventData;

    if (enrichedEvent.ActionType !== PageVisitAction) {
      // It's a click action, debounce and aggregate count
      const key = `${enrichedEvent.ActionType}-${enrichedEvent.Action}-${enrichedEvent.PageUrl}`;
      if (pendingClicks.has(key)) {
        const existing = pendingClicks.get(key)!;
        if ("Count" in existing && "Count" in enrichedEvent) {
          existing.Count += enrichedEvent.Count || 1;
        }
        existing.CreatedDate = enrichedEvent.CreatedDate;
      } else {
        pendingClicks.set(key, enrichedEvent);
      }

      if (!batchTimer) {
        batchTimer = setTimeout(() => {
          pendingClicks.forEach((event) => {
            socket?.emit(NOVA_USER_ACTIVITY_EVENT, event);
          });
          pendingClicks.clear();
          batchTimer = null;
        }, 1000);
      }
    } else {
      // It's a page visit, emit immediately
      socket?.emit(NOVA_USER_ACTIVITY_EVENT, enrichedEvent);
    }
  } catch (error) {
    console.error("Nova Error: ", error);
  }
});

/**
 * Emits an event with the provided event data and optionally executes a callback function
 * @param eventData The event data to be emitted
 * @param callback Optional callback function to be executed before emitting the event
 */
export function withEvent(eventData: EventData, callback?: () => void) {
  if (callback && typeof callback === "function") {
    callback();
  }
  eventBus.emit(APP_EVENT, eventData);
}
