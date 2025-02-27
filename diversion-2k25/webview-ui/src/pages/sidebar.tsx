import { vscode } from "../utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useState, useEffect } from "react";

function Sidebar() {
  const [routesData, setRoutesData] = useState<any[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event.data);
      const message = event.data;
      if (message.command === "routesData") {
        console.log("Setting routes data:", message.data);
        setRoutesData(message.data);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const fetchRoutes = () => {
    vscode.postMessage({ command: "fetchRoutes" });
  };

  const handleShowFlow = (routeName: string) => {
    vscode.postMessage({
      command: "showFlow",
      routeName: routeName,
    });
  };

  return (
    <main>
      <VSCodeButton onClick={fetchRoutes}>Fetch Routes</VSCodeButton>
      {routesData && (
        <div>
          {routesData.map((route: any) => (
            <div
              key={route.id}
              onClick={() => handleShowFlow(route.name)}
              style={{ cursor: "pointer" }}>
              <h3>{route.name}</h3>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Sidebar;
