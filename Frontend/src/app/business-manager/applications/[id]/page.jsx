import { redirect } from "next/navigation";

export default async function LegacyWorkspaceRedirect({ params }) {
  const { id } = await params;
  redirect(`/business-manager/workspace?app=${id}`);
}
