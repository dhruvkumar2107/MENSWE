export const ROLES = {
  CUSTOMER: "CUSTOMER",
  SUPER_ADMIN: "SUPER_ADMIN",
  STORE_MANAGER: "STORE_MANAGER",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  ORDER_MANAGER: "ORDER_MANAGER",
  MARKETING_MANAGER: "MARKETING_MANAGER",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.STORE_MANAGER,
  ROLES.INVENTORY_MANAGER,
  ROLES.ORDER_MANAGER,
  ROLES.MARKETING_MANAGER,
  ROLES.CUSTOMER_SUPPORT,
];

export type Permission =
  | "product:read"
  | "product:write"
  | "product:delete"
  | "inventory:read"
  | "inventory:write"
  | "order:read"
  | "order:write"
  | "order:refund"
  | "customer:read"
  | "customer:write"
  | "coupon:read"
  | "coupon:write"
  | "content:read"
  | "content:write"
  | "review:read"
  | "review:write"
  | "return:read"
  | "return:write"
  | "report:read"
  | "analytics:read"
  | "newsletter:read"
  | "newsletter:write"
  | "staff:read"
  | "staff:write"
  | "settings:read"
  | "settings:write"
  | "audit:read";

const ALL: Permission[] = [
  "product:read", "product:write", "product:delete",
  "inventory:read", "inventory:write",
  "order:read", "order:write", "order:refund",
  "customer:read", "customer:write",
  "coupon:read", "coupon:write",
  "content:read", "content:write",
  "review:read", "review:write",
  "return:read", "return:write",
  "report:read", "analytics:read",
  "newsletter:read", "newsletter:write",
  "staff:read", "staff:write",
  "settings:read", "settings:write",
  "audit:read",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CUSTOMER: [],
  SUPER_ADMIN: ALL,
  STORE_MANAGER: [
    "product:read", "product:write", "product:delete",
    "inventory:read", "inventory:write",
    "order:read", "order:write", "order:refund",
    "customer:read", "customer:write",
    "coupon:read", "coupon:write",
    "content:read", "content:write",
    "review:read", "review:write",
    "return:read", "return:write",
    "report:read", "analytics:read",
    "newsletter:read", "newsletter:write",
    "settings:read", "settings:write",
    "audit:read",
  ],
  INVENTORY_MANAGER: [
    "product:read", "product:write",
    "inventory:read", "inventory:write",
    "report:read",
  ],
  ORDER_MANAGER: [
    "product:read",
    "order:read", "order:write",
    "customer:read",
    "return:read", "return:write",
    "report:read",
  ],
  MARKETING_MANAGER: [
    "product:read",
    "coupon:read", "coupon:write",
    "content:read", "content:write",
    "review:read", "review:write",
    "analytics:read", "report:read",
    "newsletter:read", "newsletter:write",
  ],
  CUSTOMER_SUPPORT: [
    "product:read",
    "order:read",
    "customer:read", "customer:write",
    "return:read", "return:write",
    "review:read",
  ],
};

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as Role];
  if (!perms) return false;
  return perms.includes(permission);
}

export const ORDER_STATUSES = [
  "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
] as const;

export const FULFILLMENT_STATUSES = [
  "UNFULFILLED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "COD_PENDING",
] as const;

export const RETURN_STATUSES = [
  "REQUESTED", "APPROVED", "REJECTED", "PICKED_UP", "INSPECTED", "COMPLETED",
] as const;

export const INVENTORY_MOVEMENT_TYPES = [
  "STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "RESERVATION", "RELEASE", "RETURN", "DAMAGE",
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "38", "40"] as const;

export const COUPON_TYPES = ["PERCENT", "FIXED", "FREE_SHIPPING"] as const;

export const SHIPPING = {
  freeThreshold: 149900, // ₹1,499
  standard: 9900, // ₹99
  codFee: 4900, // ₹49
};

export const CURRENCY = "INR";
