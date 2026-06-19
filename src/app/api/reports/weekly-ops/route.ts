import { ZodError } from "zod";
import { getWeeklyOpsReportCsv } from "@/server/services/weekly-ops-report-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart");

  if (!weekStart) {
    return Response.json(
      {
        error: "weekStart is required in YYYY-MM-DD format.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const csv = await getWeeklyOpsReportCsv(weekStart);

    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="weekly-ops-${weekStart}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: error.issues[0]?.message ?? "Invalid weekly report query.",
        },
        {
          status: 400,
        },
      );
    }

    throw error;
  }
}

