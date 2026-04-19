"use client";

import React, { useState } from "react";
import { Gender } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { useCreateDoctor } from "@/hooks/use-doctors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { formatIndianPhoneNumber } from "@/lib/utils";

interface AddDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddDoctorDialog({ isOpen, onClose }: AddDoctorDialogProps) {
  const { user } = useUser();
  const createDoctorMutation = useCreateDoctor();

  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    phone: "",
    speciality: "",
    gender: "MALE" as Gender,
    isActive: true,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setNewDoctor({
      name: "",
      email: "",
      phone: "",
      speciality: "",
      gender: "MALE" as Gender,
      isActive: true,
    });
    setSubmitError(null);
  };

  const handlePhoneChange = (value: string) => {
    setNewDoctor((prev) => ({ ...prev, phone: formatIndianPhoneNumber(value) }));
  };

  const handleSave = async () => {
    setSubmitError(null);
    try {
      const payload = { ...newDoctor };
      console.log("[AddDoctorDialog] submit payload:", payload);

      await createDoctorMutation.mutateAsync(payload);

      resetForm();
      onClose();
    } catch (err) {
      console.error("[AddDoctorDialog] submit error:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save doctor");
    }
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Doctor</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new doctor to your team.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name *</Label>
              <Input
                id="new-name"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                placeholder="Dr. John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-speciality">Speciality *</Label>
              <Input
                id="new-speciality"
                value={newDoctor.speciality}
                onChange={(e) => setNewDoctor({ ...newDoctor, speciality: e.target.value })}
                placeholder="General Dentistry"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email">Email *</Label>
            <Input
              id="new-email"
              type="email"
              value={newDoctor.email}
              onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
              placeholder="doctor@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-phone">Phone</Label>
            <Input
              id="new-phone"
              value={newDoctor.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="XXXXX XXXXX"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-gender">Gender</Label>
              <Select
                value={newDoctor.gender}
                onValueChange={(value) => setNewDoctor({ ...newDoctor, gender: value as Gender })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">Status</Label>
              <Select
                value={newDoctor.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setNewDoctor({ ...newDoctor, isActive: value === "active" })
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
        </div>

        {submitError ? (
          <p className="text-sm text-red-500">{submitError}</p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
            disabled={createDoctorMutation.isPending}
          >
            {createDoctorMutation.isPending ? "Adding..." : "Add Doctor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddDoctorDialog; 