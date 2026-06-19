export const mockPaymentIntentPaymentFailedEvent = {
  api_version: "2026-05-27.dahlia",
  created: 1_781_521_200,
  data: {
    object: {
      amount: 7_599,
      currency: "usd",
      customer: "cus_mock_failed_000001",
      id: "pi_mock_000002",
      last_payment_error: {
        code: "card_declined",
        decline_code: "insufficient_funds",
        message: "Mock card declined for deterministic webhook tests.",
        type: "card_error",
      },
      object: "payment_intent",
      status: "requires_payment_method",
    },
  },
  id: "evt_mock_payment_failed_000001",
  livemode: false,
  object: "event",
  pending_webhooks: 0,
  request: {
    id: "req_mock_payment_failed_000001",
    idempotency_key: "idem_mock_payment_failed_000001",
  },
  type: "payment_intent.payment_failed",
} as const;
