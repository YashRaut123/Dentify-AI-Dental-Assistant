"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDoctor, getAvailableDoctors, getDoctors } from "@/lib/actions/doctors";
import { updateDoctor } from "@/lib/actions/doctors";

export function useGetDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctors,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Parameters<typeof createDoctor>[0]) => {
      console.log("[useCreateDoctor] payload:", payload);
      const res = await createDoctor(payload);
      console.log("[useCreateDoctor] result:", res);

      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Parameters<typeof updateDoctor>[0]) => {
      console.log("[useUpdateDoctor] payload:", payload);

      const res = await updateDoctor(payload);

      console.log("[useUpdateDoctor] result:", res);

      if (!res.success) {
        throw new Error(res.message);
      }

      return res;
    },

    onSuccess: async () => {
      // Refetch doctors list after update
      await queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

// get available doctors for appointments
export function useAvailableDoctors() {
  const result = useQuery({
    queryKey: ["getAvailableDoctors"],
    queryFn: getAvailableDoctors,
  });

  return result;
}