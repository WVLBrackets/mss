import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { Environment } from "@/lib/constants";

/**
 * Prefix for outbound email subjects on non-production deployments so inboxes
 * can tell staging/preview and local apart from production. Format:
 * `🟡 Staging 🟡 ` (preview) or `🟠 Local 🟠 ` (development), then the real subject.
 */
export function emailSubjectEnvironmentPrefix(): string {
  const env = getCurrentEnvironment();
  if (env === Environment.PRODUCTION) return "";
  if (env === Environment.PREVIEW) return "🟡 Staging 🟡 ";
  return "🟠 Local 🟠 ";
}
