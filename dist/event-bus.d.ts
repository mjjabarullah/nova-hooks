export declare const ActionType: {
    readonly Button: "Button";
    readonly Menu: "Menu";
    readonly Login: "Login";
};
export declare const PageVisitAction = "Page Visit";
/**
 * Sets the project name to be included in the event data
 * @param name The name of the project
 */
export declare const setProjectName: (name: string | number) => void;
/**
 * Represents the structure of event data that can be emitted
 * Can be either a click event (Button/Menu) with a count
 * or a page visit event with duration in seconds
 */
export type EventData = {
    ActionType: keyof typeof ActionType;
    Action: string;
    EmpId: string;
    EmpRole: string;
    Count: number;
} | {
    ActionType: typeof PageVisitAction;
    Action: string;
    EmpId: string;
    EmpRole: string;
    Duration: number;
};
/**
 * Emits an event with the provided event data and optionally executes a callback function
 * @param eventData The event data to be emitted
 * @param callback Optional callback function to be executed before emitting the event
 */
export declare function withEvent(eventData: EventData, callback?: any): void;
