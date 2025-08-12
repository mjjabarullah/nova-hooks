import { useEffect } from "react";

import {
  ActionType,
  connectSocket,
  useGlobalClickTracker,
  withEvent,
} from "../../src/index";
// import {ActionType, connectSocket,useGlobalClickTracker,} from "nova-hooks"

function App() {
  useEffect(() => {
    connectSocket("https://example.com/socket/v1/nova/client", "Nova Example");
  }, []);

  useGlobalClickTracker("1234", "Admin");

  return (
    <div>
      <button
        data-nova-track-id="Button Click"
        data-nova-track-type={ActionType["Button"]}
      >
        With atributes
      </button>

      <button
        onClick={() => {
          withEvent({
            Action: "Button Click",
            ActionType: ActionType["Button"],
            EmpId: "1234",
            EmpRole: "Admin",
            Count: 1,
          });
        }}
      >
        With event method
      </button>
    </div>
  );
}

export default App;
