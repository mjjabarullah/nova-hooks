Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let socket_io_client = require("socket.io-client");
let react = require("react");
//#region src/socket.ts
var socket;
var projectName;
/**
* Connects to the socket server and emits a connection event
* @param socketUrl The URL of the socket server to connect to
*/
var connectSocket = (socketUrl, project) => {
	if (!socketUrl || socketUrl.trim() === "") throw new Error("Socket URL is required to connect.");
	if (!project || project.trim() === "") throw new Error("Project name is required to connect.");
	if (socket) return;
	socket = (0, socket_io_client.io)(socketUrl);
	projectName = project;
	socket.on("connect", () => {
		console.log("Nova socket connected");
	});
	socket.on("disconnect", () => {
		console.log("Nova socket disconnected");
	});
};
/**
* Disconnects the socket server and cleans up the instance
*/
var disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = void 0;
	}
};
//#endregion
//#region src/event-bus.ts
var SimpleEventEmitter = class {
	listeners = {};
	on(event, callback) {
		if (!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event].push(callback);
	}
	emit(event, data) {
		if (this.listeners[event]) this.listeners[event].forEach((cb) => cb(data));
	}
};
var ActionType = {
	Button: "Button",
	Menu: "Menu",
	Login: "Login",
	Link: "Link"
};
var PageVisitAction = "Page Visit";
var APP_EVENT = "APP_EVENT";
var eventBus = new SimpleEventEmitter();
var NOVA_USER_ACTIVITY_EVENT = "nova-user-activity";
var pendingClicks = /* @__PURE__ */ new Map();
var batchTimer = null;
/**
* Event listener for APP_EVENT that processes and enriches event data
* Adds project name, timestamp, and page context before sending to server
*/
eventBus.on(APP_EVENT, (eventData) => {
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
			Project: projectName,
			CreatedDate: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").replace("Z", ""),
			PageUrl: pageUrl,
			PageTitle: pageTitle
		};
		if (enrichedEvent.ActionType !== "Page Visit") {
			const key = `${enrichedEvent.ActionType}-${enrichedEvent.Action}-${enrichedEvent.PageUrl}`;
			if (pendingClicks.has(key)) {
				const existing = pendingClicks.get(key);
				if ("Count" in existing && "Count" in enrichedEvent) existing.Count += enrichedEvent.Count || 1;
				existing.CreatedDate = enrichedEvent.CreatedDate;
			} else pendingClicks.set(key, enrichedEvent);
			if (!batchTimer) batchTimer = setTimeout(() => {
				pendingClicks.forEach((event) => {
					socket?.emit(NOVA_USER_ACTIVITY_EVENT, event);
				});
				pendingClicks.clear();
				batchTimer = null;
			}, 1e3);
		} else socket?.emit(NOVA_USER_ACTIVITY_EVENT, enrichedEvent);
	} catch (error) {
		console.error("Nova Error: ", error);
	}
});
/**
* Emits an event with the provided event data and optionally executes a callback function
* @param eventData The event data to be emitted
* @param callback Optional callback function to be executed before emitting the event
*/
function withEvent(eventData, callback) {
	if (callback && typeof callback === "function") callback();
	eventBus.emit(APP_EVENT, eventData);
}
//#endregion
//#region src/hooks.ts
var getCssPath = (el) => {
	const path = [];
	let current = el;
	while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
		let selector = current.tagName.toLowerCase();
		if (current.id) {
			selector += `#${current.id}`;
			path.unshift(selector);
			break;
		} else if (current.className && typeof current.className === "string") selector += `.${current.className.trim().split(/\s+/).join(".")}`;
		path.unshift(selector);
		current = current.parentElement;
	}
	return path.join(" > ");
};
/**
* Hook to track global click events and emit them to the server
* Listens for click events on the document and automatically captures button/link clicks
* @param empId Optional employee ID for tracking
* @param roleId Optional role ID for tracking
*/
var useGlobalClickTracker = (empId, roleId) => {
	(0, react.useEffect)(() => {
		if (typeof window === "undefined") return;
		const handler = (e) => {
			let target = e.target;
			while (target && target !== document.body) {
				let trackId = target.getAttribute("data-nova-track-id");
				let actionType = target.getAttribute("data-nova-track-type");
				if (!trackId) {
					const tagName = target.tagName.toLowerCase();
					const role = target.getAttribute("role");
					const isButton = tagName === "button" || role === "button" || tagName === "input" && (target.type === "submit" || target.type === "button");
					const isLink = tagName === "a";
					const isInteractiveRole = role === "menuitem" || role === "tab" || role === "option";
					const isClickableDiv = window.getComputedStyle(target).cursor === "pointer";
					if (isButton || isLink || isInteractiveRole || isClickableDiv) {
						trackId = target.innerText?.trim() || target.getAttribute("aria-label")?.trim() || target.title?.trim() || target.getAttribute("name")?.trim() || `[UI Path] ${getCssPath(target)}`;
						actionType = isLink ? "Link" : isButton ? "Button" : "Menu";
						if (trackId.length > 80) trackId = trackId.substring(0, 80) + "...";
					}
				}
				if (trackId && actionType) {
					withEvent({
						Action: trackId,
						ActionType: actionType,
						EmpId: empId || "UNKNOWN",
						EmpRole: roleId || "UNKNOWN",
						Count: 1
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
var DURATION_THRESHOLD = 5;
/**
* Hook to track accurate active page visit duration
* Uses Page Visibility API to only count time when the tab is actively visible
* @param action The action name for the page visit
* @param empId Optional employee ID for tracking
* @param empRole Optional employee role for tracking
*/
var usePageTimeTracker = (action, empId, empRole) => {
	const activeTimeRef = (0, react.useRef)(0);
	const lastVisibleTimeRef = (0, react.useRef)(Date.now());
	const isVisibleRef = (0, react.useRef)(true);
	(0, react.useEffect)(() => {
		if (typeof window === "undefined") return;
		lastVisibleTimeRef.current = Date.now();
		isVisibleRef.current = document.visibilityState === "visible";
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				lastVisibleTimeRef.current = Date.now();
				isVisibleRef.current = true;
			} else {
				if (isVisibleRef.current) activeTimeRef.current += Date.now() - lastVisibleTimeRef.current;
				isVisibleRef.current = false;
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			let totalActiveTime = activeTimeRef.current;
			if (isVisibleRef.current) totalActiveTime += Date.now() - lastVisibleTimeRef.current;
			const duration = Math.round(totalActiveTime / 1e3);
			if (duration > DURATION_THRESHOLD) withEvent({
				Action: action,
				ActionType: PageVisitAction,
				EmpId: empId || "UNKNOWN",
				EmpRole: empRole || "UNKNOWN",
				Duration: duration
			});
		};
	}, [
		action,
		empId,
		empRole
	]);
};
//#endregion
exports.ActionType = ActionType;
exports.PageVisitAction = PageVisitAction;
exports.connectSocket = connectSocket;
exports.disconnectSocket = disconnectSocket;
Object.defineProperty(exports, "projectName", {
	enumerable: true,
	get: function() {
		return projectName;
	}
});
Object.defineProperty(exports, "socket", {
	enumerable: true,
	get: function() {
		return socket;
	}
});
exports.useGlobalClickTracker = useGlobalClickTracker;
exports.usePageTimeTracker = usePageTimeTracker;
exports.withEvent = withEvent;
