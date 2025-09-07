import type { ControlPanelState, ControlPanelAction } from '../types/control-panel.types';

export function controlPanelReducer(state: ControlPanelState, action: ControlPanelAction): ControlPanelState {
  switch (action.type) {
    case 'SET_SELECTED_ELEMENT':
      return {
        ...state,
        selectedElement: action.payload,
        validationErrors: {},
        isDirty: false
      };
    case 'SET_CLASSES':
      return { ...state, currentClasses: action.payload };
    case 'TOGGLE_SECTION':
      const newExpanded = new Set(state.expandedSections);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedSections: newExpanded };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };
    case 'RESET_STATE':
      return {
        selectedElement: null,
        currentClasses: [],
        expandedSections: new Set(['content']),
        validationErrors: {},
        isDirty: false
      };
    default:
      return state;
  }
}

export const initialControlPanelState: ControlPanelState = {
  selectedElement: null,
  currentClasses: [],
  expandedSections: new Set(['content']),
  validationErrors: {},
  isDirty: false
};
