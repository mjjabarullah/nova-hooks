import { EventEmitter } from "events";
import { socket } from "./socket";

export const ActionType = {
  Button: "Button",
  Menu: "Menu",
  Login: "Login",
} as const;

export const PageVisitAction = "Page Visit";

let projectName: string;

/**
 * Sets the project name to be included in the event data
 * @param name The name of the project
 */
export const setProjectName = (name: string) => {
  projectName = name;
};

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

const APP_EVENT = "APP_EVENT";

const eventBus = new EventEmitter();
const NOVA_USER_ACTIVITY_EVENT = "nova-user-activity";

/**
 * Event listener for APP_EVENT that processes and enriches event data
 * Adds project name and timestamp to the event data before sending to server
 * @param eventData The event data received from the emitter
 */
eventBus.on(APP_EVENT, (eventData: EventData) => {
  if (!eventData) return;

  try {
    if (!projectName || projectName.trim()) {
      throw new Error(
        "Project name was not set. Please set it using setProjectName function."
      );
    }
    Object.assign(eventData, {
      Project: projectName,
      CreatedDate: new Date().toISOString().replace("T", " ").replace("Z", ""),
    });

    socket.emit(NOVA_USER_ACTIVITY_EVENT, eventData);
  } catch (error) {
    console.error("Nova Error: ", error);
  }
});

/**
 * Emits an event with the provided event data and optionally executes a callback function
 * @param eventData The event data to be emitted
 * @param callback Optional callback function to be executed before emitting the event
 */
export function withEvent(eventData: EventData, callback?: any) {
  if (callback && typeof callback === "function") {
    callback();
  }
  eventBus.emit(APP_EVENT, eventData);
}
