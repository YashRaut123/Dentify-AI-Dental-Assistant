import React, { useEffect, useState } from 'react'
import { Doctor } from '@prisma/client';
import { useUpdateDoctor } from '@/hooks/use-doctors';
import { formatIndianPhoneNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
interface EditDoctorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    doctor: Doctor | null;

}

function EditDoctorDialog({ isOpen, onClose, doctor }: EditDoctorDialogProps) {
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(doctor);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const updateDoctorMutation = useUpdateDoctor();

    const resetForm = () => {
        setEditingDoctor(doctor);
        setSubmitError(null);
    };

    useEffect(() => {
        setEditingDoctor(doctor);
    }, [doctor]);

    const handlePhoneChange = (value: string) => {
        if (editingDoctor) {
            setEditingDoctor((prev) => prev ? { ...prev, phone: formatIndianPhoneNumber(value) } : null);
        }
    };

    const handleSave = async () => {
        setSubmitError(null);
        try {
            if (!editingDoctor || !editingDoctor.id) {
                setSubmitError("Doctor data is invalid");
                return;
            }

            const name = editingDoctor.name?.trim();
            const email = editingDoctor.email?.trim().toLowerCase();
            const phone = editingDoctor.phone?.trim();
            const speciality = editingDoctor.speciality?.trim();

            if (!name || !email || !speciality) {
                setSubmitError("Name, email and speciality are required.");
                return;
            }

            const payload = {
                id: editingDoctor.id,
                name,
                email,
                ...(phone ? { phone } : {}),
                speciality,
                isActive: editingDoctor.isActive,
            };
            console.log("[EditDoctorDialog] submit payload:", payload);

            await updateDoctorMutation.mutateAsync(payload);

            resetForm();
            onClose();
        } catch (err) {
            console.error("[EditDoctorDialog] submit error:", err);
            setSubmitError(err instanceof Error ? err.message : "Failed to save doctor");
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    resetForm();
                    setSubmitError(null);
                    onClose();
                }
            }}
        >

            {/* Dialog content goes here */}
            <DialogContent className='sm:max-w-125'>
                <DialogHeader>
                    <DialogTitle>Edit Doctor</DialogTitle>
                    <DialogDescription>
                        Update the doctor's information below. Make sure to save your changes when you're done.
                    </DialogDescription>
                </DialogHeader>

                {editingDoctor && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={editingDoctor.name || ""}
                                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="speciality">Speciality</Label>
                                <Input
                                    id="speciality"
                                    value={editingDoctor.speciality || ""}
                                    onChange={(e) =>
                                        setEditingDoctor({ ...editingDoctor, speciality: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editingDoctor.email || ""}
                                onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={editingDoctor.phone || ""}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="XXXXX XXXXX"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={editingDoctor.isActive ? "active" : "inactive"}
                                onValueChange={(value) =>
                                    setEditingDoctor({ ...editingDoctor, isActive: value === "active" })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {submitError && (
                    <p className="text-sm text-destructive">{submitError}</p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary/90"
                        disabled={updateDoctorMutation.isPending}
                    >
                        {updateDoctorMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EditDoctorDialog