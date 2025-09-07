import { getCurrentTheme, toggleTheme } from "./ui.stage-crew";

export const handlers = {
  getCurrentTheme,
  toggleTheme,
  notifyUi(data: any, ctx: any) {
    // Prefer the value computed by the previous beat and stored in payload
    const theme = ctx?.payload?.currentTheme ?? ctx?.payload?.theme;
    try {
      data?.onTheme?.(theme);
    } catch {}
  },
};
