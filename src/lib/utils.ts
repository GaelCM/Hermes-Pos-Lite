import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function redondearPrecio(monto: number): number {
  return Math.round(monto * 2) / 2;
}

export function redondearCantidad(cantidad: number, es_granel: boolean): number {
  if (es_granel) {
    // Round to 3 decimal places for bulk
    return Math.round((cantidad + Number.EPSILON) * 1000) / 1000;
  }
  // Round to nearest integer for pieces
  return Math.round(cantidad);
}

