export function normalizeTenants(response) {
  const data = response?.data?.data ?? response?.data ?? response;
  const list = Array.isArray(data) ? data : data?.tenants;
  if (!Array.isArray(list)) throw new Error('Réponse tenants invalide');
  return [...new Map(list.map(item => item?.tenant ?? item).filter(tenant => tenant?.id && (!tenant.status || tenant.status === 'ACTIVE')).map(tenant => [tenant.id, {id:tenant.id,code:tenant.code,name:tenant.name,status:tenant.status}])).values()];
}
