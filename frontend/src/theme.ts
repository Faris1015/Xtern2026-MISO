export const MISO_THEME = {
  navy: "#0B2E4F",
  blue: "#0082CA",
  blueDark: "#006DAA",
  cyan: "#5BC2E7",
  ink: "#203746",
  slate: "#516774",
  border: "#D5DEE5",
  grid: "#E4EBF0",
  surface: "#FFFFFF",
  canvas: "#F4F7F9",
  softBlue: "#EAF5FA",
  amber: "#A76500",
  amberSoft: "#F8EEDC",
  green: "#347A3A",
  greenSoft: "#E9F3EA",
  red: "#B42318",
  redSoft: "#FDECEA",
  purple: "#6554C0",
} as const;

export const CHART_SERIES = [
  MISO_THEME.blue,
  MISO_THEME.amber,
  MISO_THEME.navy,
  MISO_THEME.green,
  MISO_THEME.purple,
  "#2B7C85",
] as const;

export const CHART_TOOLTIP_STYLE = {
  border: `1px solid ${MISO_THEME.border}`,
  borderRadius: "2px",
  boxShadow: "0 8px 22px rgba(11, 46, 79, 0.12)",
  color: MISO_THEME.ink,
  fontSize: "12px",
} as const;
