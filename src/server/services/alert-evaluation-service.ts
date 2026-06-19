import {
  buildAlertCandidates,
  filterNewAlertCandidates,
  getAlertDedupeKey,
  summarizeAlertCandidatesByType,
  type AlertCandidate,
} from "@/lib/domain/alerts";

export type AlertEvaluationRepository = {
  createAlerts: (candidates: readonly AlertCandidate[]) => Promise<void>;
  readEvaluationData: () => Promise<{
    existingAlerts: readonly Pick<
      AlertCandidate,
      "customerId" | "orderId" | "paymentId" | "refundId" | "ruleId" | "type"
    >[];
    orders: Parameters<typeof buildAlertCandidates>[0]["orders"];
    payments: Parameters<typeof buildAlertCandidates>[0]["payments"];
    refunds: Parameters<typeof buildAlertCandidates>[0]["refunds"];
    rules: Parameters<typeof buildAlertCandidates>[0]["rules"];
  }>;
};

export type AlertEvaluationSummary = {
  candidateCounts: ReturnType<typeof summarizeAlertCandidatesByType>;
  created: number;
  evaluated: number;
  skippedExisting: number;
};

export async function recalculateAlerts({
  referenceDate = new Date(),
  repository,
}: {
  referenceDate?: Date;
  repository?: AlertEvaluationRepository;
} = {}): Promise<AlertEvaluationSummary> {
  const activeRepository = repository ?? (await getDefaultAlertsRepository());
  const data = await activeRepository.readEvaluationData();
  const candidates = buildAlertCandidates({
    orders: data.orders,
    payments: data.payments,
    referenceDate,
    refunds: data.refunds,
    rules: data.rules,
  });
  const existingKeys = new Set(data.existingAlerts.map(getAlertDedupeKey));
  const newCandidates = filterNewAlertCandidates({
    candidates,
    existingKeys,
  });

  if (newCandidates.length > 0) {
    await activeRepository.createAlerts(newCandidates);
  }

  return {
    candidateCounts: summarizeAlertCandidatesByType(candidates),
    created: newCandidates.length,
    evaluated: candidates.length,
    skippedExisting: candidates.length - newCandidates.length,
  };
}

async function getDefaultAlertsRepository() {
  const { alertsRepository } = await import(
    "@/server/repositories/alerts-repository"
  );

  return alertsRepository;
}
