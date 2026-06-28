import React from "react";

import { useAppState } from "./cli/hooks/useAppState.js";
import CategoryScreen from "./cli/screens/CategoryScreen.js";
import ConfirmScreen from "./cli/screens/ConfirmScreen.js";
import DoneScreen from "./cli/screens/DoneScreen.js";
import HomeScreen from "./cli/screens/HomeScreen.js";
import InfoScreen from "./cli/screens/InfoScreen.js";
import ProgressScreen from "./cli/screens/ProgressScreen.js";
import ScanningScreen from "./cli/screens/ScanningScreen.js";
import SummaryScreen from "./cli/screens/SummaryScreen.js";

export default function App() {
  const { screen } = useAppState();

  switch (screen) {
    case "home":
      return <HomeScreen />;
    case "scanning":
      return <ScanningScreen />;
    case "summary":
      return <SummaryScreen />;
    case "category":
      return <CategoryScreen />;
    case "info":
      return <InfoScreen />;
    case "confirm":
      return <ConfirmScreen />;
    case "progress":
      return <ProgressScreen />;
    case "done":
      return <DoneScreen />;
    default:
      return <HomeScreen />;
  }
}
