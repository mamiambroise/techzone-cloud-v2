import { redirect } from "next/navigation";
export default async function ApplicationWorkspaceIndexPage({
  params
}) {
  const {
    id
  } = await params;
  redirect(`/business-manager/applications/${id}/overview`);
}