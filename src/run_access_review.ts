import { createHmac } from "node:crypto";
import { runAccessReview } from "./access_review_workflow.js";

const apiKey = process.env.INFRAI_API_KEY;
const webhookSecret = process.env.WEBHOOK_SECRET;
if (!apiKey || !webhookSecret) throw new Error("INFRAI_API_KEY and WEBHOOK_SECRET are required");

const event = {
  eventId: "pay_audit_2026_09_29",
  kind: "refund.requested" as const,
  amountUsd: 12_500,
  occurredAt: "2026-09-29T09:00:00.000Z"
};
const rawEvent = JSON.stringify(event);
const notificationSignature = createHmac("sha256", webhookSecret).update(rawEvent).digest("hex");
const result = await runAccessReview({ event, notificationSignature }, rawEvent, apiKey, webhookSecret);
console.log(JSON.stringify(result, null, 2));
