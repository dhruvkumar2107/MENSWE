import { prisma } from "@/lib/db";

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown> | string;
  ip?: string | null;
}): Promise<void> {
  try {
    const details =
      typeof params.details === "string"
        ? params.details
        : params.details
          ? JSON.stringify(params.details)
          : null;
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        details,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit:error]", error);
  }
}
