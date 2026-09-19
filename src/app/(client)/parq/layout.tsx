import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/parq");
  if (user.role !== "CLIENT") redirect("/");
  return children;
}
