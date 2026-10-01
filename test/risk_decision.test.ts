import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { auditKeyReach, decideRisk, verifyNotification } from "../src/payment_access_review.js";

test("a large refund requires manual review without inferring key scopes", () => {
  const findings = auditKeyReach([{
    key_id: "key_finance_ops",
    name: "finance-ops"
  }]);
  const decision = decideRisk({
    eventId: "pay_42",
    kind: "refund.requested",
    amountUsd: 12_500,
    occurredAt: "2026-09-29T09:00:00.000Z"
  });
  assert.deepEqual(findings, [{ key_id: "key_finance_ops", name: "finance-ops" }]);
  assert.equal(decision.action, "manual_review");
});

test("notification verification detects a changed payment event", () => {
  const secret = "local-test-secret";
  const original = JSON.stringify({ eventId: "pay_42", amountUsd: 125 });
  const signature = createHmac("sha256", secret).update(original).digest("hex");
  assert.equal(verifyNotification(original, signature, secret), true);
  assert.equal(verifyNotification(`${original}x`, signature, secret), false);
});
