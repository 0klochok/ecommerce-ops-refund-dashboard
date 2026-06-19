import { recalculateAlerts } from "@/server/services/alert-evaluation-service";
import { importOrdersFromCsv } from "@/server/services/order-import-service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      {
        error: "Upload an orders CSV file using the file field.",
      },
      {
        status: 400,
      },
    );
  }

  const summary = await importOrdersFromCsv({
    fileName: file.name || "orders-import.csv",
    text: await file.text(),
  });

  if (summary.status === "COMPLETED" && summary.ordersCreated > 0) {
    await recalculateAlerts();
  }

  return Response.json(summary, {
    status: summary.status === "FAILED" ? 400 : 200,
  });
}

