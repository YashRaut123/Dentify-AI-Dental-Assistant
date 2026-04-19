import resend from "@/lib/resend";
import { NextResponse } from "next/server";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
export async function POST(request: Request) {

    try{
        const body = await request.json();

        const{
            userEmail,
            doctorName,
            appointmentDate,
            appointmentTime,
            appointmentType,
            duration,
            price,
        } = body;

        //validate required fields
        if(!userEmail || !doctorName || !appointmentDate || !appointmentTime){
            return new Response(JSON.stringify({success:false, message:"Missing required fields"}), {status:400});
        }

        //send the email
        const { data, error } = await resend.emails.send({
            from: "Dentify <no-reply@resend.dev>",// only for testing
            to:[userEmail],
            subject: "Appointment Confirmation - Dentify",
            react:AppointmentConfirmationEmail({
                doctorName,
                appointmentDate,
                appointmentTime,
                appointmentType,
                duration,
                price,
            }),
        });

        if(error){
            console.error("Error sending email:", error);
            return new NextResponse(JSON.stringify({success:false, message:"Failed to send confirmation email"}), {status:500});
        }
        return NextResponse.json({message:"Email sent Successfully", emailId:data?.id}, {status:200});




    } catch(error){
        console.error("Unexpected error sending email:", error);
        return new NextResponse(JSON.stringify({success:false, message:"Internal server error"}), {status:500});
    }
}