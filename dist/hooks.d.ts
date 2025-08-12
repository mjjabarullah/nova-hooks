import { EventData } from './event-bus';
/**
 * Hook to track global click events and emit them to the server
 * Listens for click events on the document and emits them with the provided socket URL
 * @param empId Optional employee ID for tracking
 * @param roleId Optional role ID for tracking
 */
declare const useGlobalClickTracker: (empId?: string, roleId?: string) => void;
/**
 * Hook to track page visit duration and emit it to the server
 * Emits an event when the component unmounts with the duration of the page visit
 * @param action The action name for the page visit
 * @param empId Optional employee ID for tracking
 * @param empRole Optional employee role for tracking
 */
declare const usePageTimeTracker: (action: EventData["Action"], empId?: EventData["EmpId"], empRole?: EventData["EmpRole"]) => void;
export { useGlobalClickTracker, usePageTimeTracker };
