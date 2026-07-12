import type { Prisma } from "@prisma/client";
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

// Thrown when a vehicle or driver was claimed by a concurrent dispatch between
// validation and the status flip.
export class DispatchConflictError extends Error {}

// Atomically claims the vehicle and driver for a trip inside the caller's
// transaction. The status guard in the WHERE clause is what makes this safe
// under concurrency: two simultaneous dispatches both pass validateDispatch,
// but only one UPDATE matches status = AVAILABLE — the other sees count 0 and
// the whole transaction rolls back.
export async function claimForDispatch(
  tx: Prisma.TransactionClient,
  vehicleId: number,
  driverId: number,
): Promise<void> {
  const vehicle = await tx.vehicle.updateMany({
    where: { id: vehicleId, status: "AVAILABLE" },
    data: { status: "ON_TRIP" },
  });
  if (vehicle.count === 0) {
    throw new DispatchConflictError("Vehicle is no longer available for dispatch");
  }

  const driver = await tx.driver.updateMany({
    where: { id: driverId, status: "AVAILABLE", licenseExpiry: { gte: new Date() } },
    data: { status: "ON_TRIP" },
  });
  if (driver.count === 0) {
    throw new DispatchConflictError("Driver is no longer available for dispatch");
  }
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
