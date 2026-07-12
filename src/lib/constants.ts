// Central definition of roles, statuses, and their display labels.
// Kept in one place so business rules and UI stay in sync.

export const ROLES = {
  FLEET_MANAGER: "FLEET_MANAGER",
  DRIVER: "DRIVER",
  SAFETY_OFFICER: "SAFETY_OFFICER",
  FINANCIAL_ANALYST: "FINANCIAL_ANALYST",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const VEHICLE_STATUS = {
  AVAILABLE: "AVAILABLE",
  ON_TRIP: "ON_TRIP",
  IN_SHOP: "IN_SHOP",
  RETIRED: "RETIRED",
} as const;

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

export const DRIVER_STATUS = {
  AVAILABLE: "AVAILABLE",
  ON_TRIP: "ON_TRIP",
  OFF_DUTY: "OFF_DUTY",
  SUSPENDED: "SUSPENDED",
} as const;

export const DRIVER_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

export const TRIP_STATUS = {
  DRAFT: "DRAFT",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const TRIP_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const VEHICLE_TYPES = ["Truck", "Van", "Car", "Bus", "Bike"];
export const LICENSE_CATEGORIES = ["LMV", "HMV", "MCWG", "Other"];
export const EXPENSE_CATEGORIES = ["TOLL", "REPAIR", "INSURANCE", "FINE", "OTHER"];

// Which roles may perform write actions on each resource group.
// Every authenticated user can read; writes are gated below.
export const WRITE_ACCESS: Record<string, Role[]> = {
  vehicles: ["FLEET_MANAGER"],
  drivers: ["FLEET_MANAGER", "SAFETY_OFFICER"],
  trips: ["FLEET_MANAGER", "DRIVER"],
  maintenance: ["FLEET_MANAGER"],
  fuel: ["FLEET_MANAGER", "DRIVER"],
  expenses: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
};
