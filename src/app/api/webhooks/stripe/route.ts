import { handleStripeWebhookRequest } from "@/server/services/stripe-webhook-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStripeWebhookRequest({
    request,
  });
}

