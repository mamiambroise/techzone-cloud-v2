import { ERP_CAPABILITY_PROBES, ERP_RESOURCE_CATALOG } from './erp-resource-catalog';
import { classifyProbe } from '../capabilities/erp-capability.service';

describe('ERP resource catalogue', () => {
  it('has one unique definition for every Phase 11.1 resource', () => {
    expect(ERP_RESOURCE_CATALOG).toHaveLength(29);
    expect(new Set(ERP_RESOURCE_CATALOG.map((resource) => resource.key)).size).toBe(ERP_RESOURCE_CATALOG.length);
    expect(ERP_RESOURCE_CATALOG.find((resource) => resource.key === 'invoice')?.adapterImplemented).toBe(true);
    expect(ERP_RESOURCE_CATALOG.find((resource) => resource.key === 'category')?.adapterImplemented).toBe(false);
  });

  it('uses the adapter endpoint for Agenda probes', () => {
    expect(ERP_CAPABILITY_PROBES.find((probe) => probe.capability === 'agenda.read')).toMatchObject({ method: 'GET', path: '/agendaevents' });
    expect(ERP_CAPABILITY_PROBES.find((probe) => probe.capability === 'agenda.create')).toMatchObject({ method: 'POST', path: '/agendaevents' });
  });

  it('preserves provider outcomes instead of turning them into AVAILABLE', () => {
    const invoiceProbe = ERP_CAPABILITY_PROBES.find((probe) => probe.capability === 'invoice.read')!;
    const paymentProbe = ERP_CAPABILITY_PROBES.find((probe) => probe.capability === 'payment.create')!;
    const customerUpdate = ERP_CAPABILITY_PROBES.find((probe) => probe.capability === 'customer.update')!;
    expect(classifyProbe(invoiceProbe, 403).status).toBe('MODULE_DISABLED');
    expect(classifyProbe(paymentProbe, 501).status).toBe('NOT_SUPPORTED');
    expect(classifyProbe(customerUpdate, 500).status).toBe('UNKNOWN');
  });
});
