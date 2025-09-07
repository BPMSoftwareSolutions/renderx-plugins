import React from "react";
import {
  setSelectionObserver,
  setClassesObserver,
} from "../state/observer.store";
import {
  controlPanelReducer,
  initialControlPanelState,
} from "../state/control-panel.reducer";
import type { ControlPanelAction as _ControlPanelAction } from "../types/control-panel.types";

export function useControlPanelState() {
  const [state, dispatch] = React.useReducer(
    controlPanelReducer,
    initialControlPanelState
  );

  React.useEffect(() => {
    setSelectionObserver((selectionModel) => {
      dispatch({ type: "SET_SELECTED_ELEMENT", payload: selectionModel });
      dispatch({ type: "SET_CLASSES", payload: selectionModel?.classes || [] });
    });
    setClassesObserver((classData) => {
      if (classData?.classes) {
        dispatch({ type: "SET_CLASSES", payload: classData.classes });
      }
    });
    return () => {
      setSelectionObserver(null);
      setClassesObserver(null);
    };
  }, []);

  return { state, dispatch };
}
