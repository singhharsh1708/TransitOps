import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding TransitOps database...");

  // Clear existing data (order matters due to relations).
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const pass = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: { name: "Fiona Fleet", email: "fleet@transitops.com", passwordHash: pass, role: "FLEET_MANAGER" },
    }),
    prisma.user.create({
      data: { name: "Dan Driver", email: "driver@transitops.com", passwordHash: pass, role: "DRIVER" },
    }),
    prisma.user.create({
      data: { name: "Sam Safety", email: "safety@transitops.com", passwordHash: pass, role: "SAFETY_OFFICER" },
    }),
    prisma.user.create({
      data: { name: "Fay Finance", email: "finance@transitops.com", passwordHash: pass, role: "FINANCIAL_ANALYST" },
    }),
  ]);
  const fleetManager = users[0];

  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: { registrationNo: "GJ-01-AB-1234", name: "Tata Ace", type: "Van", maxLoadKg: 750, odometer: 45210, acquisitionCost: 650000, region: "West", status: "AVAILABLE" },
    }),
    prisma.vehicle.create({
      data: { registrationNo: "GJ-05-CD-5678", name: "Ashok Leyland Dost", type: "Truck", maxLoadKg: 1500, odometer: 88900, acquisitionCost: 900000, region: "West", status: "AVAILABLE" },
    }),
    prisma.vehicle.create({
      data: { registrationNo: "MH-12-EF-9012", name: "Mahindra Bolero", type: "Car", maxLoadKg: 500, odometer: 60120, acquisitionCost: 850000, region: "Central", status: "IN_SHOP" },
    }),
    prisma.vehicle.create({
      data: { registrationNo: "DL-03-GH-3456", name: "Eicher Pro", type: "Truck", maxLoadKg: 5000, odometer: 120340, acquisitionCost: 2200000, region: "North", status: "AVAILABLE" },
    }),
    prisma.vehicle.create({
      data: { registrationNo: "KA-09-IJ-7890", name: "Force Traveller", type: "Bus", maxLoadKg: 2000, odometer: 30500, acquisitionCost: 1600000, region: "South", status: "RETIRED" },
    }),
  ]);

  const drivers = await Promise.all([
    prisma.driver.create({
      data: { name: "Rajesh Kumar", licenseNo: "GJ0120210001", licenseCategory: "HMV", licenseExpiry: daysFromNow(400), contactNo: "9876543210", safetyScore: 92, status: "AVAILABLE" },
    }),
    prisma.driver.create({
      data: { name: "Amit Sharma", licenseNo: "MH1220200042", licenseCategory: "LMV", licenseExpiry: daysFromNow(120), contactNo: "9812345678", safetyScore: 88, status: "AVAILABLE" },
    }),
    prisma.driver.create({
      data: { name: "Suresh Patel", licenseNo: "GJ0520190077", licenseCategory: "HMV", licenseExpiry: daysFromNow(-10), contactNo: "9900112233", safetyScore: 75, status: "AVAILABLE" },
    }),
    prisma.driver.create({
      data: { name: "Vikram Singh", licenseNo: "DL0320220123", licenseCategory: "HMV", licenseExpiry: daysFromNow(20), contactNo: "9765432109", safetyScore: 60, status: "SUSPENDED" },
    }),
  ]);

  // A completed trip so reports have data.
  const completed = await prisma.trip.create({
    data: {
      source: "Ahmedabad", destination: "Surat", cargoWeightKg: 600, plannedDistance: 265,
      finalOdometer: 45475, fuelConsumed: 33, revenue: 18000, status: "COMPLETED",
      dispatchedAt: daysFromNow(-3), completedAt: daysFromNow(-3),
      vehicleId: vehicles[0].id, driverId: drivers[0].id, createdById: fleetManager.id,
    },
  });

  // A draft trip ready to dispatch in the demo.
  await prisma.trip.create({
    data: {
      source: "Ahmedabad", destination: "Vadodara", cargoWeightKg: 900, plannedDistance: 110,
      status: "DRAFT", vehicleId: vehicles[1].id, driverId: drivers[1].id, createdById: fleetManager.id,
    },
  });

  await prisma.maintenance.create({
    data: { title: "Clutch replacement", description: "Full clutch assembly", cost: 12500, status: "OPEN", vehicleId: vehicles[2].id, createdById: fleetManager.id },
  });

  await prisma.fuelLog.createMany({
    data: [
      { liters: 33, cost: 3300, odometer: 45475, vehicleId: vehicles[0].id, createdById: fleetManager.id },
      { liters: 50, cost: 5000, odometer: 88900, vehicleId: vehicles[1].id, createdById: fleetManager.id },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { category: "TOLL", amount: 450, note: "Ahmedabad-Surat expressway", vehicleId: vehicles[0].id, createdById: fleetManager.id },
      { category: "INSURANCE", amount: 22000, note: "Annual premium", vehicleId: vehicles[1].id, createdById: fleetManager.id },
    ],
  });

  void completed;
  console.log("Seed complete.");
  console.log("Login accounts (password: password123):");
  console.log("  fleet@transitops.com     Fleet Manager");
  console.log("  driver@transitops.com    Driver");
  console.log("  safety@transitops.com    Safety Officer");
  console.log("  finance@transitops.com   Financial Analyst");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
