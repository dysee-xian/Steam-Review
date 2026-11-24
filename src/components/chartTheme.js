export const chartPalette = {
  blue: "var(--color-primary)",
  sage: "var(--color-positive)",
  lavender: "var(--color-neutral)",
  rose: "var(--color-negative)",
  amber: "var(--color-orange)",
  teal: "var(--color-teal)",
};

export const sentimentColors = {
  POSITIVE: chartPalette.sage,
  NEUTRAL: chartPalette.lavender,
  NEGATIVE: chartPalette.rose,
};

export const chartGridColor = "var(--color-border)";

export const chartAxis = {
  fill: "var(--color-muted)",
  fontSize: 12,
};

export const chartTooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 14,
  boxShadow: "var(--shadow-card)",
  color: "var(--color-text)",
  fontSize: 12,
};

export const chartCursorStyle = {
  fill: "var(--color-primary-tint)",
};
