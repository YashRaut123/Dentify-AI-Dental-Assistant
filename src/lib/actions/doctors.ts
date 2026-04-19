"use server";

import { prisma } from "../prisma";
import { Prisma, Gender, Doctor } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: { _count: { select: { appointments: true } } },
      orderBy: { createdAt: "desc" },
    });

    return doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
    }));
  } catch (error) {
    console.error("[getDoctors] error:", error);
    throw new Error("Failed to fetch doctors");
  }
}

interface CreateDoctorInput {
  clerkId?: string;
  name: string;
  email: string;
  phone?: string;
  speciality: string;
  gender: Gender;
  isActive: boolean;
}

type CreateDoctorResult = {
  success: boolean;
  message: string;
  data?: Doctor;
  reason?: "VALIDATION" | "DUPLICATE" | "UNKNOWN";
  duplicateField?: string;
};

export async function createDoctor(input: CreateDoctorInput): Promise<CreateDoctorResult> {
  console.log("[createDoctor] incoming:", input);

  try {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const speciality = input.speciality?.trim();
    const phone = input.phone?.trim() || undefined;
    const gender = input.gender;
    const isActive = input.isActive ?? true;
    const clerkId = input.clerkId?.trim() || `doctor_${crypto.randomUUID()}`;

    if (!name || !email || !speciality || !gender) {
      return {
        success: false,
        reason: "VALIDATION",
        message: "Name, email, speciality and gender are required.",
      };
    }

    // upsert by email (email must be @unique in schema)
    const doctor = await prisma.doctor.upsert({
      where: { email },
      update: {
        name,
        speciality,
        isActive,
        ...(phone ? { phone } : {}),
      },
      create: {
        clerkId,
        name,
        email,
        speciality,
        isActive,
        ...(phone ? { phone } : {}),
      },
    });

    console.log("[createDoctor] saved:", doctor.id);
    revalidatePath("/admin");

    return {
      success: true,
      message: "Doctor saved successfully.",
      data: doctor,
    };
  } catch (error: unknown) {
    console.error("[createDoctor] full error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(", ")
          : String(error.meta?.target ?? "unique field");

        return {
          success: false,
          reason: "DUPLICATE",
          duplicateField: target,
          message: `Duplicate value for: ${target}`,
        };
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        reason: "VALIDATION",
        message: "Invalid data sent to database. Check required fields.",
      };
    }

    return {
      success: false,
      reason: "UNKNOWN",
      message: "Failed to save doctor.",
    };
  }
}

interface UpdateDoctorInput {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  isActive?: boolean;
}
type UpdateDoctorResult = {
  success: true;
  doctor: Doctor;
} | {
  success: false;
  message: string;
};

export async function updateDoctor(input: UpdateDoctorInput & { specialization?: string }): Promise<UpdateDoctorResult> {
  console.log("[updateDoctor] incoming payload:", {
    id: input?.id,
    name: input?.name,
    email: input?.email,
    phone: input?.phone,
    specialization: input?.specialization,
    speciality: input?.speciality,
  });

  try {
    const id = input?.id?.trim();
    if (!id) {
      return { success: false, message: "Doctor id is required." };
    }

    const normalizeOptional = (value: string | undefined) => {
      if (value === undefined) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : "";
    };

    const name = normalizeOptional(input.name);
    const email = normalizeOptional(input.email)?.toLowerCase();
    const phone = normalizeOptional(input.phone);
    const speciality = normalizeOptional(input.speciality ?? input.specialization);

    if (name === "") return { success: false, message: "Name cannot be empty." };
    if (email === "") return { success: false, message: "Email cannot be empty." };
    if (phone === "") return { success: false, message: "Phone cannot be empty." };
    if (speciality === "") {
      return { success: false, message: "Speciality cannot be empty." };
    }

    const currentDoctor = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!currentDoctor) {
      return { success: false, message: "Doctor not found." };
    }

    const prismaInput: Prisma.DoctorUpdateInput = {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(speciality !== undefined ? { speciality } : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
    };

    console.log("[updateDoctor] prisma input:", {
      where: { id },
      data: prismaInput,
    });

    if (Object.keys(prismaInput).length === 0) {
      return { success: false, message: "No valid fields provided to update." };
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: prismaInput,
    });

    revalidatePath("/admin");

    return {
      success: true,
      doctor,
    };


  } catch (error) {
    console.error("[updateDoctor] full error object:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(", ")
          : String(error.meta?.target ?? "unique field");

        return {
          success: false,
          message: `Duplicate value for: ${target}`,
        };
      }

      return {
        success: false,
        message: `Database request error (${error.code}).`,
      };
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        message: "Invalid data sent to database.",
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update doctor.",
    };
  }
}

export async function getAvailableDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
    }));
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    throw new Error("Failed to fetch available doctors");
  }
}