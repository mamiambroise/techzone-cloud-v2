import React from 'react';
import { useTenant } from '../contexts/TenantProvider.jsx';
import ErpConnection from '../erp/ErpConnection.jsx';
export default function Settings() {
  const { activeTenant } = useTenant();
  return <ErpConnection key={activeTenant?.id} />;
}
