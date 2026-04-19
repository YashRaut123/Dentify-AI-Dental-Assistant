import { useAvailableDoctors } from "@/hooks/use-doctors";
import { InitialAvatar } from "@/components/ui/avatar";

function DoctorInfo({ doctorId }: { doctorId: string }) {
  const { data: doctors = [] } = useAvailableDoctors();
  const doctor = doctors.find((d) => d.id === doctorId);

  if (!doctor) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <InitialAvatar
        name={doctor.name || "Doctor"}
        size="default"
      />
      <div>
        <h3 className="font-medium">{doctor.name}</h3>
        <p className="text-sm text-muted-foreground">{doctor.speciality || "General Dentistry"}</p>
      </div>
    </div>
  );
}

export default DoctorInfo;