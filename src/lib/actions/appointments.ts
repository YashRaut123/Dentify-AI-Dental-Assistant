"use server";

import { prisma } from "../prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AppointmentStatus, Prisma } from "@prisma/client";

function transformAppointment(appointment: any) {
  const user = appointment.User ?? appointment.user;
  const doctor = appointment.Doctor ?? appointment.doctor;

  return {
    ...appointment,
    patientName: `${user?.FirstName || user?.firstName || ""} ${user?.LastName || user?.lastName || ""}`.trim(),
    patientEmail: user?.email ?? "",
    doctorName: doctor?.name ?? "Doctor",
    doctorImageUrl: doctor?.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

async function getOrCreatePrismaUser(clerkId: string) {
  console.log("[appointments] resolving prisma user for clerkId:", clerkId);

  if (typeof clerkId !== "string" || !clerkId.trim()) {
    throw new Error("Authentication error: clerkId is missing or invalid.");
  }

  const existingUser = await prisma.user.findUnique({ where: { clerkId } });
  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (!primaryEmail) {
    throw new Error("Unable to create user record: missing email in Clerk profile.");
  }

  const firstName = clerkUser?.firstName ?? undefined;
  const lastName = clerkUser?.lastName ?? undefined;
  const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber ?? undefined;

  try {
    const createdUser = await prisma.user.create({
      data: {
        clerkId,
        email: primaryEmail,
        FirstName: firstName,
        LastName: lastName,
        phone,
      },
    });

    console.log("[appointments] created prisma user for clerkId:", clerkId);
    return createdUser;
  } catch (error) {
    // Handle race conditions where another request creates the same user first.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const userAfterConflict = await prisma.user.findUnique({ where: { clerkId } });
      if (userAfterConflict) {
        return userAfterConflict;
      }
    }

    throw error;
  }
}



export async function getAppointments() {
    try {
        const appointments = await prisma.appointment.findMany({
            include: {
                User:{
                    select:{
                        FirstName:true,
                        LastName:true,
                        email:true,
                    },
                },
                Doctor: { select : {name : true , imageUrl:true}},
            },
            orderBy: { createdAt: 'desc' },
        });
        return appointments;
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
    }
}

export async function getUserAppointments() {
    try{
        const {userId} = await auth();
        console.log("[getUserAppointments] auth userId:", userId);
        if(!userId) throw new Error("You must be authenticated to view appointments");

        const user = await getOrCreatePrismaUser(userId);
        if (!user?.id) {
            throw new Error("User record not found after creation");
        }

        const appointments = await prisma.appointment.findMany({
            where: { userId: user.id },
            include: {
                User: {
                    select: {
                        FirstName: true,
                        LastName: true,
                        email: true,
                    },
                },
                Doctor: { select: { name: true, imageUrl: true } },
            },
            orderBy: [{ date: "asc" }, { time: "asc" }],
        });
        return appointments.map(transformAppointment);

    } catch(error){
        console.error("Error fetching user appointments:", error);
        return [];
    }
}


export async function getUserAppointmentStats(){
    try{
        const {userId} = await auth();
        console.log("[getUserAppointmentStats] auth userId:", userId);
        if(!userId) throw new Error("You must be authenticated to get appointment stats");

        const user = await getOrCreatePrismaUser(userId);
        if (!user?.id) {
            throw new Error("User record not found after creation");
        }

        //These calls will run in parallel, instead of waiting for each other
        const [totalCount, completedCount] = await Promise.all([
            prisma.appointment.count({ where: { userId: user.id } }),
            prisma.appointment.count({ 
                where: { 
                    userId: user.id, 
                    status: AppointmentStatus.COMPLETED 
                } 
            }),
        ]);

        return {
            totalAppointments: totalCount,
            completedAppointments: completedCount,
        };

    } catch(error){
        console.error("Error fetching appointment stats:", error);
        return { totalAppointments: 0, completedAppointments: 0 };
    }
}

export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED],
        },
      },
      select: { time: true },
    });

    return appointments.map((appointment) => appointment.time);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return []; // return empty array if there's an error
  }
}

interface BookAppointmentInput {
  doctorId: string;
  date: string | Date;
  time: string;
  reason?: string;
  type?: string;
}

type BookAppointmentResult =
  | { success: true; message: string; data: ReturnType<typeof transformAppointment> }
  | { success: false; message: string };

const getPrismaErrorMessage = (error: Prisma.PrismaClientKnownRequestError): string => {
  if (error.code === "P2002") {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(", ")
      : String(error.meta?.target ?? "unique field");
    return `Duplicate value for: ${target}`;
  }

  if (error.code === "P2003") {
    return "Related record does not exist (invalid doctor or user reference).";
  }

  if (error.code === "P2025") {
    return "Required record was not found while booking the appointment.";
  }

  return error.message;
};

export async function bookAppointment(input: BookAppointmentInput): Promise<BookAppointmentResult> {
  try {
    console.log("[bookAppointment] incoming payload:", {
      doctorId: input.doctorId,
      date: input.date,
      time: input.time,
      type: input.type,
      reason: input.reason,
    });

    // Step 1: Validate auth context
    const { userId } = await auth();
    console.log("[bookAppointment] auth context:", { userId });
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return { success: false, message: "You must be logged in to book an appointment." };
    }

    // Step 2: Validate and normalize input fields
    const doctorId = input.doctorId?.trim();
    const time = input.time?.trim();
    
    if (!doctorId || doctorId.length === 0) {
      return { success: false, message: "Doctor ID is required." };
    }

    if (!time || time.length === 0) {
      return { success: false, message: "Time slot is required." };
    }

    // Step 3: Validate and parse date
    let parsedDate: Date;
    try {
      parsedDate = input.date instanceof Date ? input.date : new Date(input.date);
      
      if (!(parsedDate instanceof Date) || Number.isNaN(parsedDate.getTime())) {
        return { success: false, message: "Invalid date format. Please provide a valid date." };
      }

      // Ensure date is in the future
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (parsedDate < now) {
        return { success: false, message: "Appointment date must be in the future." };
      }
    } catch (dateError) {
      console.error("[bookAppointment] date parsing error:", dateError);
      return { success: false, message: "Invalid date provided." };
    }

    // Step 4: Get or create user
    let user;
    try {
      user = await getOrCreatePrismaUser(userId);
    } catch (userError) {
      console.error("[bookAppointment] user creation error:", userError);
      return { success: false, message: "Failed to retrieve user information." };
    }

    if (!user || !user.id) {
      console.error("[bookAppointment] user has no id after creation:", user);
      return { success: false, message: "User record is invalid." };
    }

    // Step 5: Verify doctor exists
    const doctor = await prisma.doctor.findUnique({ 
      where: { id: doctorId }, 
      select: { id: true } 
    });
    
    if (!doctor?.id) {
      return { success: false, message: "Doctor not found. Please choose another doctor." };
    }

    // Step 6: Build and validate Prisma create data
    const prismaCreateData = {
      userId: user.id,
      patientId: user.id,
      doctorId: doctorId,
      date: parsedDate,
      time: time,
      reason: input.reason?.trim() || "General consultation",
      status: AppointmentStatus.SCHEDULED,
    };

    // Validate all required fields are present and not null
    if (!prismaCreateData.userId || !prismaCreateData.patientId || !prismaCreateData.doctorId) {
      console.error("[bookAppointment] missing required fields:", {
        userId: prismaCreateData.userId,
        patientId: prismaCreateData.patientId,
        doctorId: prismaCreateData.doctorId,
      });
      return { success: false, message: "Missing required appointment fields." };
    }

    console.log("[bookAppointment] prisma create input:", {
      ...prismaCreateData,
      date: prismaCreateData.date.toISOString(),
    });

    // Step 7: Create appointment
    const appointment = await prisma.appointment.create({
      data: prismaCreateData,
      include: {
        User: {
          select: {
            FirstName: true,
            LastName: true,
            email: true,
          },
        },
        Doctor: { select: { name: true, imageUrl: true } },
      },
    });

    console.log("[bookAppointment] appointment created successfully:", appointment.id);

    return {
      success: true,
      message: "Appointment booked successfully.",
      data: transformAppointment(appointment),
    };
  } catch (error) {
    console.error("[bookAppointment] full error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "N/A",
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, message: getPrismaErrorMessage(error) };
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("[bookAppointment] validation error details:", error.message);
      return { success: false, message: "Invalid data sent to database. Please check all fields and try again." };
    }

    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return { success: false, message: "Unknown error while booking appointment." };
  }
}

export async function updateAppointmentStatus(input: { id: string; status: AppointmentStatus }) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    return appointment;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }
}

