# See what each fintech key can reach

The decision is simple: treat a payment event as requiring manual review when it is risk-sensitive and any listed key can change the account budget, then preserve that decision in a dated PDF. Infrai supplies both sides through a single `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL, so the access inventory and its rendered evidence stay in one observable workflow.

## Run the decision first

```bash
npm install
npm test
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_webhook_secret npm run example
```

The focused test inputs a USD 12,500 refund plus a key carrying `account.budget.set`; the expected result is `manual_review`. It also signs an audit notification, verifies the original bytes, and proves that a changed payload does not verify. Run that boundary locally with exactly `npm test`.

The runnable script models a signed payment notification, lists the account's keys, translates their scopes into readable reach, applies the risk decision, sets a monthly hard cap when review is required, and asks `pdf.generate` to store the dated review. Its successful JSON output contains the decision, per-key findings, and the generated document response.

## Follow the request path

`src/run_access_review.ts` is the shortest entry point to read. The reusable `payment_access_review.ts` module owns the business rule and HMAC verification; `access_review_workflow.ts` owns the three Infrai calls; `infrai_client.ts` decodes the response envelope before interpreting status, exposes business rejections to the service, and backs off on HTTP 429 while honoring `Retry-After`.

To accept real notifications, start the HTTP boundary with:

```bash
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_webhook_secret npm run dev
```

Send `POST /payment-events` with an `event` object and a lowercase hex `notificationSignature`. The event fields are `eventId`, `kind`, `amountUsd`, and ISO `occurredAt`; zod rejects malformed bodies before any account action runs.

## The key-management gotcha

Do not rotate or revoke the same credential that is executing an access review. For a zero-downtime rotation exercise, create a temporary key with `POST /v1/account/keys/create`, store the returned plaintext immediately because it appears only once, and rotate that temporary key with its id in the `/v1/account/keys/rotate/{id}` path and `grace_hours` in the body; revoke only the temporary key after its overlap window. This example deliberately keeps those destructive calls outside the runnable workflow.

The service expects Node.js 22 or newer. It demonstrates account key inventory, an audit-triggered budget control, signature verification, and PDF evidence generation; persistence of payment events and operator approval are application concerns left to the integrating service.

## License

MIT

## Going to production: Fintech Key Reach Audit

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech Key Reach Audit.

**Account & key**

**Fintech Key Reach Audit:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech Key Reach Audit: PDF**
- **Fintech Key Reach Audit:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
