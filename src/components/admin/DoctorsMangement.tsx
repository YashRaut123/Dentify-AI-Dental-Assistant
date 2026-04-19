import React from 'react'
import { useGetDoctors } from '@/hooks/use-doctors'
import { useState } from 'react'
import { Card, CardDescription, CardHeader,CardTitle,CardContent } from '@/components/ui/card'
import { Edit, PlusIcon, StethoscopeIcon, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MailIcon, PhoneIcon, EditIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InitialAvatar } from '@/components/ui/avatar';
import AddDoctorDialog from './AddDoctorDialog';
import EditDoctorDialog from './EditDoctorDialog';

function DoctorsManagement() {
  const { data: doctors = [] } = useGetDoctors();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<(typeof doctors)[number] | null>(null);

  const handleEditDoctor = (doctor: (typeof doctors)[number]) => {
    setSelectedDoctor(doctor);
    setIsEditDialogOpen(true);
  }

  const handleCloseEditDialog = () => {
    setSelectedDoctor(null);
    setIsEditDialogOpen(false);
  }

 
 

  return (
    <>
    <Card className="mb-12">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>
            <StethoscopeIcon className="size-5 text-primary"/>
             Doctors Management
          </CardTitle>
          <CardDescription>
            Manage your dental professionals and their schedules.
          </CardDescription>
        </div>

        <Button onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          className='bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary'>
          <PlusIcon className="mr-2 size-4" />
          Add Doctor
        </Button>

      </CardHeader>


       <CardContent>
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <InitialAvatar
                    name={doctor.name || "Doctor"}
                    size="default"
                  />

                  <div className="min-w-0">
                    <div className="font-semibold">{doctor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {doctor.speciality}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground break-all">
                        <MailIcon className="h-3 w-3" />
                        {doctor.email}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PhoneIcon className="h-3 w-3" />
                        {doctor.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end w-full lg:w-auto">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{doctor.appointmentCount}</div>
                    <div className="text-xs text-muted-foreground">Appointments</div>
                  </div>

                  {doctor.isActive ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 w-full sm:w-auto"
                    onClick={() => handleEditDoctor(doctor)}
                  >
                    <EditIcon className="size-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>




    </Card>

    <AddDoctorDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} />

      <EditDoctorDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        doctor={selectedDoctor}
        key={selectedDoctor?.id}
      />
    </>
  )
}

export default DoctorsManagement