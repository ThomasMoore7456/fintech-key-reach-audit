import { randomUUID } from "node:crypto";
import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";
import {
  auditKeyReach,
  decideRisk,
  paymentEventSchema,
  renderReviewMarkdown,
  verifyNotification
} from "./payment_access_review.js";

const keyRecordSchema = z.object({
  key_id: z.string(),
  name: z.string()
});

const keyListSchema = z.object({
  items: z.array(keyRecordSchema)
}).transform((value) => value.items);

export const reviewRequestSchema = z.object({
  event: paymentEventSchema,
  notificationSignature: z.string().regex(/^[a-f0-9]{64}$/)
});

export async function runAccessReview(
  input: z.infer<typeof reviewRequestSchema>,
  rawEvent: string,
  apiKey: string,
  webhookSecret: string,
  client = new InfraiClient(apiKey)
) {
  if (!verifyNotification(rawEvent, input.notificationSignature, webhookSecret)) {
    throw new Error("Notification signature did not match");
  }

  const keysData = await client.request("/v1/account/keys/list", "GET");
  const findings = auditKeyReach(keyListSchema.parse(keysData));
  const decision = decideRisk(input.event);

  if (decision.action === "manual_review") {
    await client.request("/v1/account/budget/set", "PUT", {
      hard_cap_usd: input.event.amountUsd,
      period: "monthly",
      alert_threshold_usd: input.event.amountUsd * 0.8
    });
  }

  const date = input.event.occurredAt.slice(0, 10);
  const markdown = renderReviewMarkdown(date, input.event, findings, decision);
  const document = await client.request("/v1/pdf/generate", "POST", {
    markdown,
    page_size: "A4",
    orientation: "portrait",
    store: true
  });

  return {
    reviewId: randomUUID(),
    date,
    decision,
    findings,
    document
  };
}
