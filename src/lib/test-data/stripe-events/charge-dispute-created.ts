export const mockChargeDisputeCreatedEvent = {
  api_version: "2026-01-01.mock",
  created: 1_781_528_400,
  data: {
    object: {
      amount: 12_900,
      charge: "ch_mock_disputed_000001",
      currency: "usd",
      id: "dp_mock_created_000001",
      object: "dispute",
      payment_intent: "pi_mock_disputed_000001",
      reason: "product_not_received",
      status: "needs_response",
    },
  },
  id: "evt_mock_dispute_created_000001",
  livemode: false,
  object: "event",
  pending_webhooks: 0,
  request: {
    id: "req_mock_dispute_created_000001",
    idempotency_key: "idem_mock_dispute_created_000001",
  },
  type: "charge.dispute.created",
} as const;
