export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451];
export const DEFAULT_ZOOM = 5;

export const EVENT_TYPE_COLORS: Record<string, string> = {
  protest: "#f59e0b",
  road_block: "#ef4444",
  traffic_disruption: "#f97316",
  fire: "#dc2626",
  flood: "#3b82f6",
  rain: "#6366f1",
  power_outage: "#8b5cf6",
  security_incident: "#ef4444",
  political_rally: "#eab308",
  earthquake: "#b91c1c",
  natural_disaster: "#7c3aed",
  economic_alert: "#06b6d4",
  general_alert: "#64748b",
  not_event: "#374151",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  protest: "Protest",
  road_block: "Road Block",
  traffic_disruption: "Traffic Disruption",
  fire: "Fire",
  flood: "Flood",
  rain: "Rain / Waterlogging",
  power_outage: "Power Outage",
  security_incident: "Security Incident",
  political_rally: "Political Rally",
  earthquake: "Earthquake",
  natural_disaster: "Natural Disaster",
  economic_alert: "Economic Alert",
  general_alert: "General Alert",
  not_event: "Not an Event",
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#64748b",
};

export const STATUS_COLORS: Record<string, string> = {
  confirmed: "#22c55e",
  likely: "#3b82f6",
  developing: "#f59e0b",
  unverified: "#64748b",
};

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

export const SOURCE_TYPES = [
  "Manual",
  "X",
  "Facebook",
  "Instagram",
  "News",
  "Government",
];

export const TIME_RANGES = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
];
