import { recalculateAlerts } from "@/server/services/alert-evaluation-service";

export async function POST() {
  const summary = await recalculateAlerts();

  return Response.json(summary);
}

