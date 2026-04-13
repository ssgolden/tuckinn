// Money utility functions
// All amounts are stored as Decimal (EUR format, e.g., "9.95")
// Minor units are cents (e.g., 995)

export function toMinorUnits(amount: unknown): number {
  return Math.round(Number(amount ?? 0) * 100);
}

export function fromMinorUnits(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function toDisplayAmount(value: unknown): number {
  return Number(Number(value ?? 0).toFixed(2));
}