import { BadRequestException } from '@nestjs/common';

/** Checks whether a string consists only of decimal digits (unsigned integer). */
export function isUnsignedInteger(value: string): boolean {
  return /^\d+$/.test(value);
}

/** Throws a BadRequestException when amount is not a positive safe integer. */
export function assertPositiveInteger(amount: number, field: string): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new BadRequestException(`Invalid ${field} amount.`);
  }
}
