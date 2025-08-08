import { EventData } from './event-bus';
/**
 * Hook to track global click events and emit them to the server
 * Listens for click events on the document and emits them with the provided socket URL
 * @param socketUrl The URL of the socket server to connect to
 * @param empId Optional employee ID for tracking
 * @param roleId Optional role ID for tracking
 */
declare const useGlobalClickTracker: (socketUrl: string, projectName: string, empId?: string, roleId?: string) => void;
export type PageTimeTrackingData = Pick<EventData, "Action"> & {
    EmpId?: EventData["EmpId"];
    EmpRole?: EventData["EmpRole"];
};
/**
 * Hook to track time spent on a page and emit an event when the user leaves
 * @param {Object} params - The tracking parameters
 * @param {string} params.Action - The page/action being tracked
 * @param {string} params.EmpId - Employee ID of the current user
 * @param {string} params.EmpRole - Role of the current user
 */
declare const usePageTimeTracker: ({ Action, EmpId, EmpRole, }: PageTimeTrackingData) => void;
export { useGlobalClickTracker, usePageTimeTracker };
