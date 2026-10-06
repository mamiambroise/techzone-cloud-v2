// Bounded, resumable provisioning. Never invokes the historical demo seed.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { apps } = require('./ph7-spec.cjs');
const target = process.argv[2];
require('./ph7-live-gate.cjs').gate(target);
const url = new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);
assert(url.hostname === '127.0.0.1' && url.port === '55432');
url.pathname = '/' + target; process.env.DATABASE_URL = url.toString();
const { PrismaService } = require('../dist/prisma/prisma.service');
const { DataModelService } = require('../dist/modules/business-manager/data-model/data-model.service');
const { ConfigurationService } = require('../dist/modules/platform/configuration/configuration.service');
const { NavigationService } = require('../dist/modules/business-manager/navigation/navigation.service');
const prisma = new PrismaService(), model = new DataModelService(prisma);
const configuration = new ConfigurationService(prisma), navigation = new NavigationService(prisma);
function id(key) {
  const hex = createHash('sha256').update('techzone-phase7:' + key).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
async function insert(delegate, key, data) {
  const uuid = id(key);
  const current = await delegate.findUnique({ where: { id: uuid } });
  if (current) {
    for (const field of ['code','tenantId','applicationId','applicationVersionId']) if (data[field] !== undefined) assert.equal(current[field], data[field], 'Ownership mismatch: ' + key);
    return current;
  }
  return delegate.create({ data: { id: uuid, ...data } });
}
async function main() {
  assert.equal((await prisma.$queryRawUnsafe('select current_database() as name'))[0].name, target);
  // Preserve every user/credential. Grant the existing non-test administrator
  // membership only in the two newly provisioned tenants so they are selectable.
  const administrator=await prisma.iamUser.findFirstOrThrow({where:{isAdmin:true,status:'ACTIVE',NOT:{username:{startsWith:'PH7-TEST-'}}},orderBy:{id:'asc'}});
  for (const app of apps) {
    const tenant = await insert(prisma.tenant, app.tenant, { code: app.tenant, name: app.commercialName, status: 'ACTIVE' });
    if(!await prisma.membership.findFirst({where:{tenantId:tenant.id,userId:administrator.id,status:'ACTIVE'}})) await insert(prisma.membership,app.code+':admin-membership',{tenantId:tenant.id,userId:administrator.id,status:'ACTIVE'});
    const application = await insert(prisma.application, app.code, { code: app.code, name: app.name, tenantId: tenant.id, description: 'Phase 7 — managed two-app provisioning', status: 'ACTIVE' });
    const version = await insert(prisma.applicationVersion, app.code + ':1.0.0', { applicationId: application.id, tenantId: tenant.id, version: '1.0.0', status: 'DRAFT', releaseNotes: 'Phase 7 — managed two-app provisioning' });
    const scope = { tenantId: tenant.id, applicationId: application.id, applicationVersionId: version.id };
    const entities = {};
    for (const spec of app.entities) {
      const entity = await prisma.bmEntity.findFirst({ where: { ...scope, code: spec.code } }) || await model.createEntity(version.id, { code: spec.code, name: spec.name }, tenant.id);
      entities[spec.code] = entity;
      for (const [position, field] of spec.fields.entries()) {
        const actual = await prisma.bmField.findFirst({ where: { entityId: entity.id, code: field.code } }) || await model.createField(entity.id, { ...field, position }, tenant.id);
        assert.equal(actual.type, field.type, 'Existing field type differs; refusing overwrite');
        if (field.values && !await prisma.bmFieldValidation.findFirst({ where: { fieldId: actual.id, validationType: 'ALLOWED_VALUES' } })) {
          await model.createFieldValidation({ fieldId: actual.id, validationType: 'ALLOWED_VALUES', value: field.values.join(',') }, tenant.id);
        }
      }
      // Lifecycle promotion is restricted to this provisioner's owned version.
      if (entity.status === 'DRAFT') await prisma.bmEntity.update({ where: { id: entity.id }, data: { status: 'ACTIVE' } });
      const feature = await insert(prisma.bmFeature, app.code + ':feature:' + spec.code, { ...scope, code: spec.code, name: spec.name, status: 'ACTIVE', source: 'PHASE7', tags: ['phase7'] });
      await insert(prisma.bmVersionFeature, app.code + ':enabled:' + spec.code, { ...scope, featureCode: spec.code, enabled: true });
      for (const operation of ['read','create','update','delete']) {
        const code = spec.code + '.' + operation;
        await insert(prisma.bmFeatureCapability, app.code + ':capability:' + code, { featureId: feature.id, tenantId: tenant.id, code, name: spec.name + ' ' + operation, status: 'ACTIVE', requiredEntities: [spec.code] });
        await insert(prisma.bmVersionCapability, app.code + ':enabled:' + code, { ...scope, featureCode: spec.code, capabilityCode: code, enabled: true });
      }
    }
    for (const spec of app.entities) for (const field of spec.fields.filter(f => f.target)) {
      const sourceEntityId = entities[spec.code].id, targetEntityId = entities[field.target].id;
      if (!await prisma.bmRelation.findFirst({ where: { applicationVersionId: version.id, sourceEntityId, code: field.code } })) await model.createRelation(version.id, { code: field.code, sourceEntityId, targetEntityId, relationType: 'MANY_TO_ONE', required: field.required, deleteBehavior: 'RESTRICT' }, tenant.id);
    }
    for (const [key, value] of Object.entries({ commercialName: app.commercialName, currency: 'MGA', country: 'Madagascar', ...app.configuration })) {
      if (!await prisma.configuration.findFirst({ where: { tenantId: tenant.id, scope: 'APPLICATION_VERSION', scopeId: version.id, key } })) await configuration.create({ key, value, type: typeof value === 'boolean' ? 'BOOLEAN' : 'STRING', scope: 'APPLICATION_VERSION', scopeId: version.id, version: '1.0.0' }, tenant.id);
      const config=await prisma.configuration.findFirstOrThrow({where:{tenantId:tenant.id,scope:'APPLICATION_VERSION',scopeId:version.id,key}});
      if(config.status==='DRAFT')await configuration.validate(config.id,tenant.id);
      if(['DRAFT','READY'].includes(config.status))await configuration.activate(config.id,tenant.id);
    }
    for(const [entity, actions] of Object.entries(app.actions))for(const [action,value] of Object.entries(actions)){
      const code=entity+'.'+action;
      const feature=await insert(prisma.bmFeature,app.code+':feature:'+code,{...scope,code,name:entity+' '+action,status:'ACTIVE',source:'PHASE7',tags:['phase7']});
      await insert(prisma.bmVersionFeature,app.code+':enabled:'+code,{...scope,featureCode:code,enabled:true});
      await insert(prisma.bmFeatureCapability,app.code+':capability:'+code,{featureId:feature.id,tenantId:tenant.id,code,name:entity+' '+action,status:'ACTIVE',requiredEntities:[entity],configuration:{transition:{entity,...(typeof value==='object'?value:{field:'status',value})}}});
      await insert(prisma.bmVersionCapability,app.code+':enabled-cap:'+code,{...scope,featureCode:code,capabilityCode:code,enabled:true});
    }
    const menu = await prisma.bmMenu.findFirst({where:{applicationVersionId:version.id,code:'main'}}) || await navigation.createMenu(version.id,{code:'main',name:app.commercialName,location:'SIDEBAR'},tenant.id);
    const item = async (code, data) => await prisma.bmNavigationItem.findFirst({where:{menuId:menu.id,code}}) || await navigation.createMenuItem(menu.id,{code,...data},tenant.id);
    await item('dashboard',{label:'Dashboard',itemType:'LINK',routePath:'/dashboard',orderIndex:0});
    let orderIndex=1;
    for(const [label, entries] of Object.entries(app.navigation)) {
      if(entries.length===1) await item(label.toLowerCase(),{label,itemType:'LINK',routePath:`/${entries[0]}`,requiredCapabilities:[entries[0]+'.read'],orderIndex:orderIndex++});
      else {
        const group=await item(label.toLowerCase(),{label,itemType:'GROUP',orderIndex:orderIndex++});
        for(const [index,code] of entries.entries()) await item(label.toLowerCase()+'-'+code,{label:app.entities.find(e=>e.code===code).name,itemType:'LINK',parentItemId:group.id,routePath:`/${code}`,requiredCapabilities:[code+'.read'],orderIndex:index});
      }
    }
    console.log(JSON.stringify({ code: app.code, tenantId: tenant.id, applicationId: application.id, applicationVersionId: version.id, entities: Object.keys(entities).length, fields: app.entities.reduce((n,e)=>n+e.fields.length,0), relations: app.entities.reduce((n,e)=>n+e.fields.filter(f=>f.target).length,0) }));
  }
}
main().catch(e => { console.error(e.message.replaceAll(decodeURIComponent(url.password), '[REDACTED]')); process.exitCode = 1; }).finally(() => prisma.$disconnect());
