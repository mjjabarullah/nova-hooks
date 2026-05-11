import { useEffect, useRef } from "react";
import { ActionType, EventData, PageVisitAction, withEvent } from "./event-bus";

/**
 * Helper utility to generate a unique CSS selector path for an HTML element.
 * Used as a fallback identifier when a clicked element lacks semantic text or explicit tracking IDs.
 * @param el The HTML element to generate a path for
 * @returns A string representing the CSS selector path (e.g., 'div.container > button#submit')
 */
const getCssPath = (el: HTMLElement): string => {
  const path = [];
  let current: HTMLElement | null = el;
  while (
    current &&
    current.nodeType === Node.ELEMENT_NODE &&
    current !== document.body
  ) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // IDs are unique enough
    } else if (current.className && typeof current.className === "string") {
      selector += `.${current.className.trim().split(/\s+/).join(".")}`;
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(" > ");
};

/**
 * React hook to track global click events and automatically emit them to the server.
 * Attaches a single event listener to the document (event delegation) to capture clicks.
 * It intelligently identifies interactive elements (buttons, links, pointer cursors) and
 * extracts their labels or generates a CSS path fallback if no label is found.
 * 
 * @param empId Optional employee ID for tracking identity
 * @param roleId Optional role ID for tracking authorization/role
 */
const useGlobalClickTracker = (empId?: string, roleId?: string) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        let trackId = target.getAttribute("data-nova-track-id");
        let actionType = target.getAttribute("data-nova-track-type") as
          | keyof typeof ActionType
          | null;

        // Auto-capture for elements without explicit track ID
        if (!trackId) {
          const tagName = target.tagName.toLowerCase();
          const role = target.getAttribute("role");

          // Check for semantic buttons/links
          const isButton =
            tagName === "button" ||
            role === "button" ||
            (tagName === "input" &&
              ((target as HTMLInputElement).type === "submit" ||
                (target as HTMLInputElement).type === "button"));
          const isLink = tagName === "a";

          // Check for non-semantic clickable divs/spans
          const isInteractiveRole =
            role === "menuitem" || role === "tab" || role === "option";
          const isClickableDiv =
            window.getComputedStyle(target).cursor === "pointer";

          if (isButton || isLink || isInteractiveRole || isClickableDiv) {
            // 1. Try to get text content or aria-label
            const textContent =
              target.innerText?.trim() ||
              target.getAttribute("aria-label")?.trim() ||
              target.title?.trim() ||
              target.getAttribute("name")?.trim();

            // 2. If no text is available (e.g. icon-only div), generate a CSS path
            trackId = textContent || `[UI Path] ${getCssPath(target)}`;

            actionType = isLink ? "Link" : isButton ? "Button" : "Menu";

            if (trackId.length > 80) {
              trackId = trackId.substring(0, 80) + "...";
            }
          }
        }

        if (trackId && actionType) {
          withEvent({
            Action: trackId,
            ActionType: actionType as keyof typeof ActionType,
            EmpId: empId || "UNKNOWN",
            EmpRole: roleId || "UNKNOWN",
            Count: 1,
          });
          break; // Stop bubbling once tracked
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

/** 
 * Minimum active dwell time (in seconds) required before a page visit event is considered valid and emitted.
 */
const DURATION_THRESHOLD = 5;

/**
 * React hook to track accurate active page visit duration.
 * Utilizes the native Page Visibility API to pause the timer when the user switches tabs
 * or minimizes the browser, ensuring only actual active dwell time is recorded.
 * Emits the payload automatically when the component unmounts.
 * 
 * @param action The specific action name or page identifier for the visit
 * @param empId Optional employee ID for tracking identity
 * @param empRole Optional employee role for tracking authorization/role
 */
const usePageTimeTracker = (
  action: EventData["Action"],
  empId?: EventData["EmpId"],
  empRole?: EventData["EmpRole"],
) => {
  const activeTimeRef = useRef(0);
  const lastVisibleTimeRef = useRef(Date.now());
  const isVisibleRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastVisibleTimeRef.current = Date.now();
    isVisibleRef.current = document.visibilityState === "visible";

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastVisibleTimeRef.current = Date.now();
        isVisibleRef.current = true;
      } else {
        if (isVisibleRef.current) {
          activeTimeRef.current += Date.now() - lastVisibleTimeRef.current;
        }
        isVisibleRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      let totalActiveTime = activeTimeRef.current;
      if (isVisibleRef.current) {
        totalActiveTime += Date.now() - lastVisibleTimeRef.current;
      }

      const duration = Math.round(totalActiveTime / 1000);

      if (duration > DURATION_THRESHOLD) {
        withEvent({
          Action: action,
          ActionType: PageVisitAction,
          EmpId: empId || "UNKNOWN",
          EmpRole: empRole || "UNKNOWN",
          Duration: duration,
        });
      }
    };
  }, [action, empId, empRole]);
};

export { useGlobalClickTracker, usePageTimeTracker };
