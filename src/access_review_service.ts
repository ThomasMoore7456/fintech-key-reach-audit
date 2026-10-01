import { createServer } from "node:http";
import { InfraiError } from "./infrai_client.js";
import { reviewRequestSchema, runAccessReview } from "./access_review_workflow.js";

const apiKey = process.env.INFRAI_API_KEY;
const webhookSecret = process.env.WEBHOOK_SECRET;
if (!apiKey || !webhookSecret) {
  throw new Error("INFRAI_API_KEY and WEBHOOK_SECRET are required");
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/payment-events") {
    response.writeHead(404).end();
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
    const input = reviewRequestSchema.parse(body);
    const rawEvent = JSON.stringify(input.event);
    const result = await runAccessReview(input, rawEvent, apiKey, webhookSecret);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError && error.status < 500 ? error.status : 400;
    const code = error instanceof InfraiError ? error.code : "INVALID_REQUEST";
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: code }));
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Access review service listening on http://localhost:${port}`));
