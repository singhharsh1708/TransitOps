import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateDispatch, claimForDispatch, DispatchConflictError } from "../lib/rules";
import { prisma } from "../lib/db";

// Mock the prisma client
vi.mock("../lib/db", () => {
  return {
    prisma: {
      vehicle: {
        findUnique: vi.fn(),
      },
      driver: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe("validateDispatch business rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validVehicle = {
    id: 1,
    registrationNo: "GJ-01-AB-1234",
    name: "Tata Ace",
    type: "Van",
    maxLoadKg: 750,
    odometer: 45210,
    acquisitionCost: 650000,
    region: "West",
    status: "AVAILABLE",
  };

  const validDriver = {
    id: 1,
    name: "Rajesh Kumar",
    licenseNo: "GJ0120210001",
    licenseCategory: "HMV",
    licenseExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days in future
    contactNo: "9876543210",
    safetyScore: 92,
    status: "AVAILABLE",
  };

  it("should pass when vehicle, driver, and cargo are valid", async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(validVehicle as any);
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(validDriver as any);

    const result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });

    expect(result).toEqual({ ok: true });
  });

  it("should fail when vehicle is not found", async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(validDriver as any);

    const result = await validateDispatch({
      vehicleId: 99,
      driverId: 1,
      cargoWeightKg: 500,
    });

    expect(result).toEqual({ ok: false, message: "Vehicle not found" });
  });

  it("should fail when driver is not found", async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(validVehicle as any);
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(null);

    const result = await validateDispatch({
      vehicleId: 1,
      driverId: 99,
      cargoWeightKg: 500,
    });

    expect(result).toEqual({ ok: false, message: "Driver not found" });
  });

  it("should fail when vehicle is RETIRED or IN_SHOP", async () => {
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(validDriver as any);

    // Test RETIRED
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
      ...validVehicle,
      status: "RETIRED",
    } as any);
    let result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });
    expect(result).toEqual({
      ok: false,
      message: "Vehicle is RETIRED and cannot be dispatched",
    });

    // Test IN_SHOP
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
      ...validVehicle,
      status: "IN_SHOP",
    } as any);
    result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });
    expect(result).toEqual({
      ok: false,
      message: "Vehicle is IN_SHOP and cannot be dispatched",
    });
  });

  it("should fail when vehicle is already ON_TRIP", async () => {
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(validDriver as any);
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
      ...validVehicle,
      status: "ON_TRIP",
    } as any);

    const result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });

    expect(result).toEqual({ ok: false, message: "Vehicle is already On Trip" });
  });

  it("should fail when driver license has expired", async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(validVehicle as any);
    vi.mocked(prisma.driver.findUnique).mockResolvedValue({
      ...validDriver,
      licenseExpiry: new Date(Date.now() - 1000 * 60), // 1 minute in past
    } as any);

    const result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });

    expect(result).toEqual({ ok: false, message: "Driver's license has expired" });
  });

  it("should fail when driver status is SUSPENDED, ON_TRIP, or OFF_DUTY", async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(validVehicle as any);

    // Test SUSPENDED
    vi.mocked(prisma.driver.findUnique).mockResolvedValue({
      ...validDriver,
      status: "SUSPENDED",
    } as any);
    let result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });
    expect(result).toEqual({
      ok: false,
      message: "Driver is Suspended and cannot be assigned",
    });

    // Test ON_TRIP
    vi.mocked(prisma.driver.findUnique).mockResolvedValue({
      ...validDriver,
      status: "ON_TRIP",
    } as any);
    result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });
    expect(result).toEqual({
      ok: false,
      message: "Driver is already On Trip",
    });

    // Test OFF_DUTY
    vi.mocked(prisma.driver.findUnique).mockResolvedValue({
      ...validDriver,
      status: "OFF_DUTY",
    } as any);
    result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 500,
    });
    expect(result).toEqual({
      ok: false,
      message: "Driver is Off Duty and cannot be assigned",
    });
  });

  it("should fail when cargo weight exceeds vehicle capacity", async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(validVehicle as any);
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(validDriver as any);

    const result = await validateDispatch({
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 800, // exceeds 750
    });

    expect(result).toEqual({
      ok: false,
      message: "Cargo 800kg exceeds vehicle capacity 750kg",
    });
  });
});

describe("claimForDispatch atomic status claim", () => {
  function makeTx(vehicleCount: number, driverCount: number) {
    return {
      vehicle: { updateMany: vi.fn().mockResolvedValue({ count: vehicleCount }) },
      driver: { updateMany: vi.fn().mockResolvedValue({ count: driverCount }) },
    };
  }

  it("should flip both vehicle and driver to ON_TRIP when both are available", async () => {
    const tx = makeTx(1, 1);
    await claimForDispatch(tx as any, 1, 2);

    expect(tx.vehicle.updateMany).toHaveBeenCalledWith({
      where: { id: 1, status: "AVAILABLE" },
      data: { status: "ON_TRIP" },
    });
    expect(tx.driver.updateMany).toHaveBeenCalledWith({
      where: { id: 2, status: "AVAILABLE", licenseExpiry: { gte: expect.any(Date) } },
      data: { status: "ON_TRIP" },
    });
  });

  it("should throw when the vehicle was claimed concurrently", async () => {
    const tx = makeTx(0, 1);
    await expect(claimForDispatch(tx as any, 1, 2)).rejects.toBeInstanceOf(
      DispatchConflictError,
    );
    // Never touches the driver once the vehicle claim fails.
    expect(tx.driver.updateMany).not.toHaveBeenCalled();
  });

  it("should throw when the driver was claimed concurrently", async () => {
    const tx = makeTx(1, 0);
    await expect(claimForDispatch(tx as any, 1, 2)).rejects.toBeInstanceOf(
      DispatchConflictError,
    );
  });
});
