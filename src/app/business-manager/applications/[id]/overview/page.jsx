"use client";

import React, { useContext } from "react";
import { WorkspaceContext } from "../layout";
import { OverviewTab } from "@/components/workspace/OverviewTab";
export default function WorkspaceOverviewPage() {
  const {
    application,
    versions,
    activities,
    refresh
  } = useContext(WorkspaceContext);
  if (!application) return null;
  return <OverviewTab application={application} versions={versions} activities={activities} onRefresh={refresh} />;
}