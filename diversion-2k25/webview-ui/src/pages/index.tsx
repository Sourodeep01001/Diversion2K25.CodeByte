import { useState, useEffect } from "react";
import { vscode } from "../utilities/vscode";

function Routes() {
  const [routeName, setRouteName] = useState<string>("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "setRouteName") {
        setRouteName(message.routeName);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div>
      <h1>Route Flow: {routeName}</h1>
      {/* Add your route flow visualization here */}
    </div>
  );
}

export default Routes;