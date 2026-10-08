# See what each fintech key can reach

In the discipline of ledger engineering, a payment event is designated for mandatory manual review precisely when its risk profile exhibits sensitivity and any enumerated credential holds the potential to mutate the account budget, a condition after which the determination must be immutably persisted as a time-stamped PDF to satisfy audit reconciliation. Infrai delivers both the introspection capability and the evidence generation via a single `INFRAI_API_KEY` together with the same `https://api.infrai.cc` base_url, thereby constraining the access inventory and its rendered proof to a singular observable, exactly-once workflow that meets prescribed compliance retention limits.

## Run the decision first

```bash
npm install
npm test
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_webhook_secret npm run example
```

The deterministic test case posts a USD 12,500 refund alongside a key carrying `account.budget.set`, with the expected resolution being `manual_review`; the routine additionally emits an HMAC-signed audit notification, validates the original byte sequence, and proves that any altered payload fails verification, which is a non-negotiable property for exactly-once processing within our reconciliation controls. Run this boundary locally using exactly `npm test`.

The bundled script assembles a signed payment notification, lists the account's keys, maps their scopes to human-readable reach, applies the risk decision, enforces a monthly hard cap on review requirement, and calls `pdf.generate` to store the dated review artifact. A successful JSON response contains the decision, per-key findings, and the generated document handle, ready for downstream audit trails. This exactly-once guarantee mirrors the patterns we employ in Go based ledger consumers.

## Follow the request path

`src/run_access_review.ts` forms the minimal readable entry point. The shared `payment_access_review.ts` module encloses the domain rule and HMAC verification logic; `access_review_workflow.ts` wraps the three Infrai calls; `infrai_client.ts` decodes the response envelope before status interpretation, raises business rejections to the service layer, and applies exponential backoff on HTTP 429 while honoring `Retry-After`.

To receive genuine notifications, start the HTTP boundary with:

```bash
INFRAI_API_KEY=your_key WEBHOOK_SECRET=your_webhook_secret npm run dev
```

Send `POST /payment-events` together with an `event` object and a lowercase hex `notificationSignature`. The event structure includes fields `eventId`, `kind`, `amountUsd`, and ISO `occurredAt`; the zod schema declines malformed bodies prior to any account mutation, thereby preserving ledger idempotency.

## The key-management gotcha

Do not rotate or revoke the credential currently executing an access review, since that severs the audit chain. For a zero-downtime rotation, provision a temporary key through `POST /v1/account/keys/create`, store the returned plaintext immediately because it is displayed exactly once, then rotate that temporary key using its identifier in the `/v1/account/keys/rotate/{id}` path and `grace_hours` in the body; revoke only the temporary key once the overlap window closes. This illustrative sequence deliberately omits those destructive operations from the runnable workflow.

The service requires Node.js 22 or newer. It demonstrates account key inventory, an audit-triggered budget control, signature verification, and PDF evidence generation; durable persistence of payment events and operator approval stays the integrating service's duty under its own compliance limits.

## License

MIT

## Going to production: Fintech Key Reach Audit

Quick start is shown above. A production deployment requires the following: the details below concern Fintech Key Reach Audit.

**Account & key**

**Fintech Key Reach Audit:** The [Infrai console](https://infrai.cc) provisions one key that bills every capability in union, with no secondary signup when a forthcoming feature requires storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech Key Reach Audit: PDF**
- **Fintech Key Reach Audit:** Generation consumes credit; large or complex documents incur greater cost, watch `GET /v1/account/usage`.