import { prisma } from "./db";

// ---------------------------------------------------------------------------
// Mandatory business rules for trip dispatch (see problem statement §4).
// These are enforced server-side so the API is the single source of truth.
// ---------------------------------------------------------------------------

export type RuleResult = { ok: true } | { ok: false; message: string };

type TripInput = {
  vehicleId: number;
  driverId: number;
  cargoWeightKg: number;
};

// Validates that a trip can be dispatched right now. Used both when a trip is
// created directly as DISPATCHED and when a DRAFT trip is dispatched.
export async function validateDispatch(input: TripInput): Promise<RuleResult> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) return { ok: false, message: "Vehicle not found" };

  const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
  if (!driver) return { ok: false, message: "Driver not found" };

  // Retired or In Shop vehicles must never be dispatched.
  if (vehicle.status === "RETIRED" || vehicle.status === "IN_SHOP") {
    return { ok: false, message: `Vehicle is ${vehicle.status} and cannot be dispatched` };
  }
  // A vehicle already On Trip cannot be assigned to another trip.
  if (vehicle.status === "ON_TRIP") {
    return { ok: false, message: "Vehicle is already On Trip" };
  }

  // Drivers with expired licenses cannot be assigned.
  if (driver.licenseExpiry.getTime() < Date.now()) {
    return { ok: false, message: "Driver's license has expired" };
  }
  // Suspended or off-duty drivers cannot be assigned.
  if (driver.status === "SUSPENDED") {
    return { ok: false, message: "Driver is Suspended and cannot be assigned" };
  }
  if (driver.status === "ON_TRIP") {
    return { ok: false, message: "Driver is already On Trip" };
  }
  if (driver.status === "OFF_DUTY") {
    return { ok: false, message: "Driver is Off Duty and cannot be assigned" };
  }

  // Cargo weight must not exceed the vehicle's maximum load capacity.
  if (input.cargoWeightKg > vehicle.maxLoadKg) {
    return {
      ok: false,
      message: `Cargo ${input.cargoWeightKg}kg exceeds vehicle capacity ${vehicle.maxLoadKg}kg`,
    };
  }

  return { ok: true };
}

// Returns vehicles eligible for dispatch selection (Available only).
export function eligibleVehicleWhere() {
  return { status: "AVAILABLE" as const };
}

// Returns drivers eligible for dispatch selection:
// Available status and a license that has not expired.
export function eligibleDriverWhere() {
  return {
    status: "AVAILABLE" as const,
    licenseExpiry: { gte: new Date() },
  };
}
