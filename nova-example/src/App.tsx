import { useEffect } from "react";
import {
  ActionType,
  connectSocket,
  useGlobalClickTracker,
  usePageTimeTracker,
  withEvent,
} from "../../src/index";

function App() {
  // Initialize Socket Connection
  useEffect(() => {
    connectSocket("https://example.com/socket/v1/nova/client", "Nova Example");
  }, []);

  // 1. Tracks all clicks seamlessly (Zero Config!)
  useGlobalClickTracker("1234", "Admin");

  // 2. Tracks true active page dwell time! (Visibility API)
  usePageTimeTracker("Home Dashboard", "1234", "Admin");

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        alignItems: "flex-start",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Nova Hooks Demo</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h3>✨ Auto-Tracked (Zero Config)</h3>
        <p style={{ fontSize: "12px", color: "gray", margin: 0 }}>
          These elements have no tracking attributes, but are automatically
          tracked!
        </p>

        {/* Auto-tracked by text content */}
        <button style={{ padding: "8px 16px", cursor: "pointer" }}>
          Auto-Tracked Button
        </button>

        {/* Auto-tracked Link */}
        <a
          href="#test"
          onClick={(e) => e.preventDefault()}
          style={{ color: "blue", textDecoration: "underline" }}
        >
          Auto-Tracked Link
        </a>

        {/* Auto-tracked generic element via cursor: pointer */}
        <div
          style={{
            cursor: "pointer",
            padding: "10px",
            background: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
          Auto-Tracked Clickable Div
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h3>🛠️ Manual Tracking</h3>

        {/* Explicit attributes */}
        <button
          data-nova-track-id="Explicit Button Click"
          data-nova-track-type={ActionType.Button}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          With Explicit Attributes
        </button>

        {/* Manual imperative event */}
        <button
          onClick={() => {
            withEvent({
              Action: "Manual Event Click",
              ActionType: ActionType.Button,
              EmpId: "1234",
              EmpRole: "Admin",
              Count: 1,
            });
          }}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          With withEvent() Method
        </button>
      </div>
    </div>
  );
}

export default App;
