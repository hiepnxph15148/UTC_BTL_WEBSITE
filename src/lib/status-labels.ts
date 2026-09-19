import type { MessageKey } from "@/i18n/messages";
import { CodState, OrderState, ReturnKind, ReturnState } from "@/lib/api";

export type OrderStatusCanon =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export function orderStateKey(state: number): MessageKey {
  switch (state) {
    case OrderState.Pending:
      return "orders.pending";
    case OrderState.Confirmed:
      return "orders.confirmed";
    case OrderState.Shipped:
      return "orders.shipped";
    case OrderState.Delivered:
      return "orders.delivered";
    case OrderState.Cancelled:
      return "orders.cancelled";
    default:
      return "orders.title";
  }
}

export function paymentStateKey(state: number): MessageKey {
  switch (state) {
    case CodState.Unpaid:
      return "pay.unpaid";
    case CodState.Collected:
      return "pay.collected";
    case CodState.PartiallyRefunded:
      return "pay.partial";
    case CodState.Refunded:
      return "pay.refunded";
    default:
      return "pay.unpaid";
  }
}

export function returnStateKey(state: number): MessageKey {
  switch (state) {
    case ReturnState.Requested:
      return "returns.requested";
    case ReturnState.Approved:
      return "returns.approved";
    case ReturnState.Rejected:
      return "returns.rejected";
    case ReturnState.Received:
      return "returns.received";
    case ReturnState.Completed:
      return "returns.completed";
    default:
      return "returns.title";
  }
}

export function returnKindKey(kind: number): MessageKey {
  return kind === ReturnKind.Exchange ? "returns.exchange" : "returns.refund";
}

export function orderStatusCanonFromState(state: number): OrderStatusCanon {
  switch (state) {
    case OrderState.Confirmed:
      return "confirmed";
    case OrderState.Shipped:
      return "shipped";
    case OrderState.Delivered:
      return "delivered";
    case OrderState.Cancelled:
      return "cancelled";
    default:
      return "pending";
  }
}

/** Map demo / legacy display strings (EN or VI) to a stable canon. */
export function orderStatusCanonFromDemo(status: string): OrderStatusCanon {
  switch (status) {
    case "Processing":
    case "Pending":
    case "Chờ xác nhận":
      return "pending";
    case "Confirmed":
    case "Đã xác nhận":
      return "confirmed";
    case "Shipped":
    case "Đang giao":
      return "shipped";
    case "Delivered":
    case "Đã giao":
      return "delivered";
    case "Canceled":
    case "Cancelled":
    case "Đã hủy":
      return "cancelled";
    default:
      return "pending";
  }
}

export function orderStatusKeyFromCanon(canon: OrderStatusCanon): MessageKey {
  switch (canon) {
    case "confirmed":
      return "orders.confirmed";
    case "shipped":
      return "orders.shipped";
    case "delivered":
      return "orders.delivered";
    case "cancelled":
      return "orders.cancelled";
    default:
      return "orders.pending";
  }
}

export function orderStatusTone(canon: OrderStatusCanon): string {
  switch (canon) {
    case "cancelled":
      return "text-orange-400";
    case "shipped":
      return "text-sky-400";
    case "delivered":
      return "text-emerald-400";
    case "pending":
    case "confirmed":
      return "text-amber-300";
    default:
      return "text-[#ed3b6b]";
  }
}
