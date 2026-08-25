"use client";

import React, { useContext, use } from "react";
import { WorkspaceContext } from "../layout";
import { PackModulesPreview } from "@/components/workspace/PackModulesPreview";
export default function WorkspaceDynamicModulePage({
  params
}) {
  const {
    module
  } = use(params);
  const {
    application
  } = useContext(WorkspaceContext);
  if (!application) return null;
  return <PackModulesPreview application={application} moduleId={module} />;
}