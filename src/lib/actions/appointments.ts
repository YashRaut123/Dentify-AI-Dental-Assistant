"use server";

import { prisma } from "../prisma";
import { auth } from "@clerk/nextjs/server";
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
        throw new Error("Failed to fetch appointments");
    }
}

export async function getUserAppointments() {
    try{
        const {userId} =await auth();
        if(!userId) throw new Error("You must be authenticated to view appointments");

        const user = await prisma.user.findUnique({where:{clerkId:userId}})
         if(!user) throw new Error("User not found");

         const appointments = await prisma.appointment.findMany({
            where:{userId:user.id},
            include:{
                User:{
                    select:{
                        FirstName:true,
                        LastName:true,
                        email:true,
                    },
                },
                Doctor: { select : {name : true , imageUrl:true}},
            },
            orderBy:[{date:"asc"}, {time:"asc"}],
         });
         return appointments.map(transformAppointment); ;

    }catch(error){
        console.error("Error fetching user appointments:", error);
        throw new Error("Failed to fetch user appointments");

    }
}


export async function getUserAppointmentStats(){
    try{
        const {userId} =await auth();
        if(!userId) throw new Error("You must be authenticated to get appointment stats");

        const user = await prisma.user.findUnique({where:{clerkId:userId}})
         if(!user) throw new Error("User not found");

         //These calls will run in parallel, instead of waiting for each other
         const [totalCount , completedCount] = await Promise.all([
            prisma.appointment.count({where:{userId:user.id}}),
            prisma.appointment.count({where:{userId:user.id , status:"COMPLETED"}}),
         ]);

         return {
            totalAppointments:totalCount,
            completedAppointments:completedCount,
         }


    }catch(error){
        console.error("Error fetching appointment stats:", error);

        return {totalAppointments:0, completedAppointments:0}

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

    const { userId } = await auth();
    console.log("[bookAppointment] auth context:", { userId });
    if (!userId) {
      return { success: false, message: "You must be logged in to book an appointment." };
    }

    const doctorId = input.doctorId?.trim();
    const time = input.time?.trim();
    const parsedDate = input.date instanceof Date ? input.date : new Date(input.date);

    const isDateValid = parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime());

    if (!doctorId || !time || !isDateValid) {
      return {
        success: false,
        message: "Invalid booking input. doctorId, date, and time are required with a valid date.",
      };
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.id) {
      return {
        success: false,
        message: "User not found. Please ensure your account is properly set up.",
      };
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
    if (!doctor?.id) {
      return { success: false, message: "Doctor not found. Please choose another doctor." };
    }

    const prismaCreateData = {
      userId: user.id,
      patientId: user.id,
      doctorId,
      date: parsedDate,
      time,
      reason: input.reason?.trim() || "General consultation",
      status: AppointmentStatus.SCHEDULED,
    };

    console.log("[bookAppointment] prisma create input:", prismaCreateData);

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

    return {
      success: true,
      message: "Appointment booked successfully.",
      data: transformAppointment(appointment),
    };
  } catch (error) {
    console.error("[bookAppointment] full error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, message: getPrismaErrorMessage(error) };
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return { success: false, message: error.message };
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

