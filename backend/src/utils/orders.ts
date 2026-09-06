import crypto from "crypto";

const randomOrderSuffix = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const padDatePart = (value: number) =>
  value < 10 ? `0${value}` : String(value);

export const createOrderNumber = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = padDatePart(now.getUTCMonth() + 1);
  const day = padDatePart(now.getUTCDate());

  return `NP-${year}${month}${day}-${randomOrderSuffix()}`;
};
