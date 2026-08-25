"use client";

import React, { useContext } from "react";
import { WorkspaceContext } from "../layout";
import { VersionsTab } from "@/components/workspace/VersionsTab";
export default function WorkspaceVersionsPage() {
  const {
    application,
    versions,
    refresh
  } = useContext(WorkspaceContext);
  if (!application) return null;
  return <VersionsTab application={application} versions={versions} onRefresh={refresh} />;
}