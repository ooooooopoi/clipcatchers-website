import { getSessionUser } from "@/lib/auth-helpers";
import { getAnalyticsData } from "@/lib/queries";
import { handleError, ok, unauthorized } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const rangeParam = new URL(request.url).searchParams.get("range") ?? "30";
    const range = ["7", "30", "90", "365"].includes(rangeParam) ? Number(rangeParam) : 30;

    return ok(await getAnalyticsData(user.id, range));
  } catch (error) {
    return handleError(error);
  }
}
