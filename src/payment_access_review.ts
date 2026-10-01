import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const paymentEventSchema = z.object({
  eventId: z.string().min(1),
  kind: z.enum(["payment.authorized", "payment.failed", "refund.requested"]),
  amountUsd: z.number().nonnegative(),
  occurredAt: z.string().datetime()
});

export type PaymentEvent = z.infer<typeof paymentEventSchema>;

export type KeyRecord = {
  key_id: string;
  name: string;
};

export type KeyFinding = KeyRecord;

export function verifyNotification(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const supplied = Buffer.from(signature, "hex");
  const wanted = Buffer.from(expected, "hex");
  return supplied.length === wanted.length && timingSafeEqual(supplied, wanted);
}

export function auditKeyReach(keys: KeyRecord[]): KeyFinding[] {
  return keys.map((key) => ({
    key_id: key.key_id,
    name: key.name
  }));
}

export function decideRisk(event: PaymentEvent) {
  const sensitiveEvent = event.kind === "refund.requested" || event.amountUsd >= 10_000;
  return {
    action: sensitiveEvent ? "manual_review" : "record",
    reason: sensitiveEvent
      ? "The payment event is risk-sensitive."
      : "The event can be recorded without escalation."
  } as const;
}

export function renderReviewMarkdown(
  date: string,
  event: PaymentEvent,
  findings: KeyFinding[],
  decision: ReturnType<typeof decideRisk>
): string {
  const rows = findings.map((finding) =>
    `| ${finding.name} | ${finding.key_id} |`
  );
  return [
    `# Fintech access review: ${date}`,
    "",
    `Payment event: ${event.eventId} (${event.kind}, USD ${event.amountUsd.toFixed(2)})`,
    `Decision: ${decision.action}`,
    `Reason: ${decision.reason}`,
    "",
    "| Key | Key ID |",
    "| --- | --- |",
    rows.join("\n")
  ].join("\n");
}
