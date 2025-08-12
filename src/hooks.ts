import { useEffect, useRef } from "react";

import { ActionType, EventData, PageVisitAction, withEvent } from "./event-bus";

/**
 * Hook to track global click events and emit them to the server
 * Listens for click events on the document and emits them with the provided socket URL
 * @param empId Optional employee ID for tracking
 * @param roleId Optional role ID for tracking
 */
const useGlobalClickTracker = (empId?: string, roleId?: string) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        const trackId = target.getAttribute("data-nova-track-id");
        const actionType = target.getAttribute("data-nova-track-type");

        if (trackId && actionType && empId && roleId) {
          withEvent({
            Action: trackId,
            ActionType: actionType as keyof typeof ActionType,
            EmpId: empId.toUpperCase(),
            EmpRole: roleId.toUpperCase(),
            Count: 1,
          });
          break;
        }
        target = target.parentElement;
      }
    };

    document.addEventListener("click", handler);
    return () => {
      document.removeEventListener("click", handler);
    };
  }, [empId, roleId]);
};

const DURATION_THRUSHOLD = 5;

/**
 * Hook to track page visit duration and emit it to the server
 * Emits an event when the component unmounts with the duration of the page visit
 * @param action The action name for the page visit
 * @param empId Optional employee ID for tracking
 * @param empRole Optional employee role for tracking
 */
const usePageTimeTracker = (
  action: EventData["Action"],
  empId?: EventData["EmpId"],
  empRole?: EventData["EmpRole"]
) => {
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration > DURATION_THRUSHOLD && empId && empRole) {
        withEvent({
          Action: action,
          ActionType: PageVisitAction,
          EmpId: empId,
          EmpRole: empRole,
          Duration: duration,
        });
      }
    };
  }, []);
};

export { useGlobalClickTracker, usePageTimeTracker };
