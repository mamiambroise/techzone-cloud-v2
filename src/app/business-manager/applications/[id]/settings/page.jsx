"use client";

import React, { useContext } from "react";
import { WorkspaceContext } from "../layout";
import { SettingsTab } from "@/components/workspace/SettingsTab";
export default function WorkspaceSettingsPage() {
  const {
    application,
    refresh
  } = useContext(WorkspaceContext);
  if (!application) return null;
  return <SettingsTab application={application} onRefresh={refresh} />;
}