import { format, parseISO } from "date-fns";

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(amount);

export const formatDate = (value: string) =>
  format(parseISO(value), "d MMM yyyy");

export const formatDateTime = (value: string) =>
  format(parseISO(value), "d MMM, h:mm a");

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
