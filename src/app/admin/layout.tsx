import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  if (!(await isSessionAdmin(session))) {
    notFound();
  }
  return <div>{children}</div>;
}
