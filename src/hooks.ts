import { useEffect, useRef } from "react";

import { ActionType, EventData, PageVisitAction, withEvent } from "./event-bus";
import { connectSocket, socket } from "./socket";

/**
 * Hook to track global click events and emit them to the server
 * Listens for click events on the document and emits them with the provided socket URL
 * @param socketUrl The URL of the socket server to connect to
 * @param empId Optional employee ID for tracking
 * @param roleId Optional role ID for tracking
 */
const useGlobalClickTracker = (
  socketUrl: string,
  projectName: string,
  empId?: string,
  roleId?: string
) => {
  useEffect(() => {
    connectSocket(socketUrl, projectName);
  }, [socketUrl]);

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
const usePageTimeTracker = ({
  Action,
  EmpId,
  EmpRole,
}: PageTimeTrackingData) => {
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    return () => {
      const Duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (Duration > DURATION_THRUSHOLD && EmpId && EmpRole) {
        withEvent({
          Action,
          EmpId,
          EmpRole,
          ActionType: PageVisitAction,
          Duration,
        });
      }
    };
  }, []);
};

export { useGlobalClickTracker, usePageTimeTracker };
