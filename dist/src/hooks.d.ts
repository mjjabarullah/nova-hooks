import { EventData } from './event-bus';
/**
 * Hook to track global click events and emit them to the server
 * Listens for click events on the document and automatically captures button/link clicks
 * @param empId Optional employee ID for tracking
 * @param roleId Optional role ID for tracking
 */
declare const useGlobalClickTracker: (empId?: string, roleId?: string) => void;
/**
 * Hook to track accurate active page visit duration
 * Uses Page Visibility API to only count time when the tab is actively visible
 * @param action The action name for the page visit
 * @param empId Optional employee ID for tracking
 * @param empRole Optional employee role for tracking
 */
declare const usePageTimeTracker: (action: EventData["Action"], empId?: EventData["EmpId"], empRole?: EventData["EmpRole"]) => void;
export { useGlobalClickTracker, usePageTimeTracker };
