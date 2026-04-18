import { loadSiteConfig, isSiteConfigError } from "@/lib/siteConfig";
import { successResponse, errorResponse } from "@/lib/api/responses";

export async function GET() {
  const cfg = await loadSiteConfig();
  if (isSiteConfigError(cfg)) {
    return errorResponse("Site configuration unavailable", 503, "CONFIG_ERROR");
  }
  return successResponse(cfg);
}
