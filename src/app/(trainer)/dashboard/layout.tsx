import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role !== "TRAINER") redirect("/");
  return children;
}
