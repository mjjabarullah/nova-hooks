import { projectName as Project, socket } from "./socket";

// Lightweight custom event emitter to avoid 'events' package dependency
type Listener = (data: any) => void;
class SimpleEventEmitter {
  private listeners: Record<string, Listener[]> = {};
  
  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const ActionType = {
  Button: "Button",
  Menu: "Menu",
  Login: "Login",
  Link: "Link",
} as const;

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

type EnrichedEventData = EventData & {
  Project: string | number;
  CreatedDate: string;
  PageUrl: string;
  PageTitle: string;
};

const APP_EVENT = "APP_EVENT";
const eventBus = new SimpleEventEmitter();
const NOVA_USER_ACTIVITY_EVENT = "nova-user-activity";

const pendingClicks = new Map<string, EnrichedEventData>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Event listener for APP_EVENT that processes and enriches event data
 * Adds project name, timestamp, and page context before sending to server
 */
eventBus.on(APP_EVENT, (eventData: EventData) => {
  if (!eventData) return;

  try {
    if (!socket) {
      console.warn("Nova socket is not initialized. Please call connectSocket first.");
      return;
    }

    const pageUrl = typeof window !== "undefined" ? window.location.pathname : "Unknown";
    const pageTitle = typeof document !== "undefined" ? document.title : "Unknown";

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
        if ('Count' in existing && 'Count' in enrichedEvent) {
          existing.Count += (enrichedEvent.Count || 1);
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
