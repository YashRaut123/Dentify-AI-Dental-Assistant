import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract up to 2 initials from a name
 * @param name - Full name or display name
 * @returns Uppercase initials (max 2 chars), or "NA" if empty
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "NA"
  const trimmed = name.trim()
  if (!trimmed) return "NA"
  
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  
  return trimmed.substring(0, 2).toUpperCase()
}

/**
 * Generate a deterministic background color class based on name
 * Same name always produces same color
 * @param name - Name to hash
 * @returns Tailwind color class (e.g. "bg-blue-500")
 */
export function getAvatarColor(name?: string | null): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ]
  
  if (!name || typeof name !== "string") return colors[0]
  
  const trimmed = name.trim()
  let hash = 0
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export function generateAvatar(name: string, gender?: string) {
  const safeName = encodeURIComponent((name || "Doctor").trim());

  // Optional color by gender, can be customized
  const background = gender === "FEMALE" ? "ec4899" : "3b82f6";

  return `https://ui-avatars.com/api/?name=${safeName}&background=${background}&color=ffffff&size=128&bold=true&format=png`;
}

export function getAvatar(name: string, image?: string | null): string {
  const safeImage = typeof image === "string" ? image.trim() : "";
  if (safeImage) return safeImage;

  const safeName = (name || "User").trim() || "User";
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeName)}`;
}

// phone formatting function for Indian numbers - ai generated 🎉
export const formatIndianPhoneNumber = (value: string) => {
  if (!value) return value;

  // Remove all non-digits
  let phone = value.replace(/\D/g, "");

  // Remove country code if user types +91 or 91
  if (phone.startsWith("91") && phone.length > 10) {
    phone = phone.slice(2);
  }

  const length = phone.length;

  // Limit to 10 digits
  phone = phone.slice(0, 10);

  // Format as: 98765 43210
  if (length <= 5) return phone;
  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
};

//  ai generated 🎉
export const getNext5Days = () => {
  const dates = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let i = 0; i < 5; i++) {
    const date = new Date(tomorrow);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
};

export const getAvailableTimeSlots = () => {
  return [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];
};

export const APPOINTMENT_TYPES = [
  { id: "checkup", name: "Regular Checkup", duration: "60 min", price: "$120" },
  { id: "cleaning", name: "Teeth Cleaning", duration: "45 min", price: "$90" },
  { id: "consultation", name: "Consultation", duration: "30 min", price: "$75" },
  { id: "emergency", name: "Emergency Visit", duration: "30 min", price: "$150" },
];
