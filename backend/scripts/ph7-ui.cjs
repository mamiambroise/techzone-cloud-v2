const fs = require('node:fs');
const assert = require('node:assert/strict');
const { apps } = require('./ph7-spec.cjs');
const target = process.argv[2]; require('./ph7-live-gate.cjs').gate(target);
const url = new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);
assert(url.hostname==='127.0.0.1' && url.port==='55432');url.pathname='/'+target;process.env.DATABASE_URL=url.toString();
const { PrismaService } = require('../dist/prisma/prisma.service');
const { UiBuilderService } = require('../dist/modules/ui-builder/ui-builder.service');
const prisma=new PrismaService(),ui=new UiBuilderService(prisma);
function tree(entity, mode) {
  const nodes={root:{id:'root',type:'Container',props:{padding:'md',gap:'md'},children:['heading','content']},heading:{id:'heading',type:'Heading',props:{text:`${entity.name} — ${mode}`,level:1},children:[]}};
  if(mode==='list') nodes.content={id:'content',type:'DataTable',props:{title:entity.name,pageSize:5,entity:entity.code},bindings:{rows:{kind:'ENTITY_LIST',entity:entity.code}},children:[]};
  else {
    nodes.content={id:'content',type:'Form',props:{title:entity.name,operation:mode==='edit'?'UPDATE':mode==='detail'?'READ':'CREATE',readonly:mode==='detail'},actions:mode==='detail'?[]:[{type:mode==='edit'?'UPDATE_RECORD':'CREATE_RECORD',config:{resource:entity.code}}],children:[]};
    for(const field of entity.fields) {
      const id='field-'+field.code;nodes.content.children.push(id);
      nodes[id]={id,type:'FormField',props:{label:field.label,readonly:mode==='detail'},bindings:{value:{kind:'ENTITY_FIELD',entity:entity.code,field:field.code}},children:[]};
    }
  }
  return {root:'root',nodes};
}
async function main(){
  assert.equal((await prisma.$queryRawUnsafe('select current_database() as name'))[0].name,target);
  const actor=await prisma.iamUser.findFirstOrThrow({where:{isAdmin:true,status:'ACTIVE'},orderBy:{id:'asc'}});
  for(const app of apps){
    const application=await prisma.application.findFirstOrThrow({where:{code:app.code,description:'Phase 7 — managed two-app provisioning'}});
    const version=await prisma.applicationVersion.findFirstOrThrow({where:{applicationId:application.id,version:'1.0.0'}});
    let order=0;
    async function page(key,title,type,route,components,permissions=[],visibility='ALWAYS'){
      const existing=await prisma.uiPage.findFirst({where:{applicationVersionId:version.id,key}});
      if(existing){
        // Repair only the exact invalid action emitted by the initial Phase 7 run.
        if(existing.metadata?.source==='PHASE7' && existing.components?.nodes?.content?.actions?.some(a=>!a.config)) await ui.updatePage(existing.id,{components},application.tenantId,actor.id);
        return;
      }
      await ui.createPage({applicationVersionId:version.id,key,title,type,route,components,permissions,visibility,order:order++,metadata:{source:'PHASE7'}},application.tenantId,actor.id);
    }
    const dashboard={root:'root',nodes:{root:{id:'root',type:'Container',props:{gap:'md'},children:[]}}};
    for(const entity of app.entities.filter(e=>!e.code.endsWith('line'))){
      const id='count-'+entity.code;dashboard.nodes.root.children.push(id);
      dashboard.nodes[id]={id,type:'DataTable',props:{title:entity.name,pageSize:3},bindings:{rows:{kind:'ENTITY_LIST',entity:entity.code}},children:[]};
    }
    await page('dashboard',app.commercialName,'DASHBOARD','/dashboard',dashboard);
    for(const entity of app.entities)for(const mode of ['list','create','detail','edit']){
      await page(entity.code+'-'+mode,entity.name+' — '+mode,mode==='list'?'LIST':mode==='detail'?'DETAIL':'FORM',`/${entity.code}${mode==='list'?'':'/'+mode}`,tree(entity,mode),[entity.code+'.'+(mode==='list'||mode==='detail'?'read':mode==='edit'?'update':'create')],mode==='list'?'ALWAYS':'HIDDEN');
    }
    const validation=await ui.validate(version.id,application.tenantId,actor.id);
    assert.notEqual(validation.status,'INVALID',JSON.stringify(validation));
    console.log(JSON.stringify({app:app.code,pages:await prisma.uiPage.count({where:{applicationVersionId:version.id}}),validation:validation.status}));
  }
}
main().catch(e=>{console.error(e.message.replaceAll(decodeURIComponent(url.password),'[REDACTED]'));process.exitCode=1;}).finally(()=>prisma.$disconnect());
