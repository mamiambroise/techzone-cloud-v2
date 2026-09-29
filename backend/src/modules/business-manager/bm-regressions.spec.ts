import { BmTenantGuard } from './bm-tenant.guard';
import { DataModelService } from './data-model/data-model.service';
import { QualityEngineService } from './quality/quality-engine.service';
import { FeatureCapabilityService } from './features/features.service';

describe('BM runtime regressions', () => {
  it('requires a selected tenant even for a super administrator', () => {
    const guard = new BmTenantGuard();
    const context = (tenantId: string | null) => ({switchToHttp:()=>({getRequest:()=>({iamPrincipal:{tenantId,isSuperAdmin:true}})})}) as any;
    expect(()=>guard.canActivate(context(null))).toThrow();
    expect(()=>guard.canActivate(context('legacy'))).toThrow();
    expect(guard.canActivate(context('tenant-a'))).toBe(true);
  });
  it('rejects a relation endpoint outside the version before writing', async () => {
    const service = new DataModelService({applicationVersion:{findFirst:async()=>({id:'v1'})},bmEntity:{findFirst:async()=>({id:'e2',applicationVersionId:'v2'})}} as any);
    await expect(service.createRelation('v1',{code:'relation',sourceEntityId:'e2',targetEntityId:'e1'},'tenant-a')).rejects.toThrow();
  });
  it('scopes capability updates to the active tenant', async () => {
    const service = new FeatureCapabilityService({bmFeatureCapability:{findFirst:async ({where}:any)=>{expect(where).toEqual({id:'foreign',tenantId:'tenant-a'});return null;}}} as any);
    await expect(service.updateCapability('foreign',{name:'Changed'},'tenant-a')).rejects.toThrow();
  });
  it('does not return PASS without a quality report', async () => {
    const service = new QualityEngineService({applicationVersion:{findFirst:async()=>({id:'v1'})},bmqQualityReport:{findFirst:async()=>null},bmqQualityGate:{findMany:async()=>[]}} as any);
    expect((await service.checkGate('v1','tenant-a')).overallStatus).toBe('NOT_EVALUATED');
  });
});
