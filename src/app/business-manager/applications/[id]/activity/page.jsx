"use client";

import React, { useContext } from "react";
import { WorkspaceContext } from "../layout";
import { ActivityTab } from "@/components/workspace/ActivityTab";
export default function WorkspaceActivityPage() {
  const {
    application
  } = useContext(WorkspaceContext);
  if (!application) return null;
  return <ActivityTab applicationId={application.id} />;
}