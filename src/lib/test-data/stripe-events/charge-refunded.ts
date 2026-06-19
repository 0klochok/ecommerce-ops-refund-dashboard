export const mockChargeRefundedEvent = {
  api_version: "2026-05-27.dahlia",
  created: 1_781_524_800,
  data: {
    object: {
      amount: 4_200,
      currency: "usd",
      id: "ch_mock_000001",
      object: "charge",
      payment_intent: "pi_mock_000001",
      refunded: true,
      refunds: {
        data: [
          {
            amount: 4_200,
            currency: "usd",
            id: "re_mock_phase4_000001",
            object: "refund",
            payment_intent: "pi_mock_000001",
            reason: "requested_by_customer",
            status: "succeeded",
          },
        ],
        object: "list",
      },
    },
  },
  id: "evt_mock_charge_refunded_000001",
  livemode: false,
  object: "event",
  pending_webhooks: 0,
  request: {
    id: "req_mock_charge_refunded_000001",
    idempotency_key: "idem_mock_charge_refunded_000001",
  },
  type: "charge.refunded",
} as const;
