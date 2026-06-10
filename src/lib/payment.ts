import type { PaymentMethod } from "../domain/model";

export function paymentMethodLabel(method: PaymentMethod) {
  return {
    bank_transfer: "Bank transfer",
    mobile_money: "Mobile money",
    cash: "Cash",
    cheque: "Cheque",
    other: "Other"
  }[method];
}
