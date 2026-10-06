// Real Data Runtime provider recipe. No SQL business-record inserts, no mock rows.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const target = process.argv[2];
require('./ph7-live-gate.cjs').gate(target);
const url = new URL(require('dotenv').parse(fs.readFileSync('.env')).DATABASE_URL);
assert(url.hostname === '127.0.0.1' && url.port === '55432');
url.pathname = '/' + target; process.env.DATABASE_URL = url.toString();
const { PrismaService } = require('../dist/prisma/prisma.service');
const { BmRecordsProvider } = require('../dist/data-runtime/data-access/bm-records.provider');
const prisma = new PrismaService(), provider = new BmRecordsProvider(prisma);
const date = '2026-10-04';
const code = (prefix, index) => `${prefix}-${String(index).padStart(3,'0')}`;
async function seed(appCode, prefix) {
  const app = await prisma.application.findFirstOrThrow({ where: { code: appCode, description: 'Phase 7 — managed two-app provisioning' } });
  const version = await prisma.applicationVersion.findFirstOrThrow({ where: { applicationId: app.id, version: '1.0.0' } });
  const actor = await prisma.iamUser.findFirstOrThrow({ where: { isAdmin: true, status: 'ACTIVE' }, orderBy: { id: 'asc' } });
  // Existing administrative identity is used only as seed audit attribution.
  // This script neither creates users nor changes credentials or memberships.
  const ctx = { tenantId: app.tenantId, userId: actor.id, permissions: ['*'] };
  let created = 0;
  async function put(entity, key, value, data) {
    const resource = `bm:${version.id}:${entity}`;
    const result = await provider.list(resource, ctx, { filter: { logic: 'AND', conditions: [{ field: key, operator: 'EQ', value }] } });
    assert(result.items.length <= 1, 'Ambiguous seed record: ' + value);
    if (result.items.length) return result.items[0].id;
    const record = await provider.create(resource, { [key]: value, ...data }, ctx);
    assert.deepEqual((await prisma.businessRecord.findUniqueOrThrow({ where: { id: record.id } })).data, { [key]: value, ...data });
    created++; return record.id;
  }
  const customers = [], suppliers = [];
  for (let i=1;i<=5;i++) customers.push(await put('customer','code',code(`CLI-${prefix}`,i),{ name: `Client ${prefix} ${i}`, phone: `+26134000000${i}`, email: `client-${prefix.toLowerCase()}-${i}@example.test`, address: 'Antananarivo, Madagascar', active:true }));
  for (let i=1;i<=3;i++) suppliers.push(await put('supplier','code',code(`FOU-${prefix}`,i),{ name: `Fournisseur ${prefix} ${i}`, email:`supplier-${prefix.toLowerCase()}-${i}@example.test`, active:true }));
  if (prefix === 'WIFI') {
    const offers=[], subscriptions=[], services=[], equipment=[];
    for(let i=1;i<=3;i++) offers.push(await put('internetoffer','code',code('OFF-WIFI',i),{name:`Fibre ${i*20} Mbps`,downloadspeed:i*20,uploadspeed:i*10,monthlyprice:i*50000,active:true}));
    for(let i=1;i<=5;i++) subscriptions.push(await put('subscription','number',code('ABO-WIFI',i),{customer:customers[i-1],internetoffer:offers[(i-1)%3],startdate:date,status:'ACTIVE',monthlyprice:((i-1)%3+1)*50000}));
    for(let i=1;i<=4;i++) services.push(await put('service','code',code('SRV-WIFI',i),{name:['Installation réseau','Maintenance','Diagnostic','Configuration routeur'][i-1],price:i*25000,active:true}));
    for(let i=1;i<=5;i++) equipment.push(await put('networkequipment','reference',code('EQP-WIFI',i),{name:`Routeur réseau ${i}`,brand:'Techzone',category:'Réseau',purchaseprice:80000,saleprice:120000,stock:10,supplier:suppliers[(i-1)%3],active:true}));
    for(let i=1;i<=5;i++) {
      const order=await put('order','number',code('CMD-WIFI',i),{customer:customers[i-1],date,status:'CONFIRMED',subtotal:145000,discount:0,total:145000});
      // One equipment line and one service line per order; scope by parent + item type.
      for (const [itemtype, extra, price] of [['EQUIPMENT',{networkequipment:equipment[i-1]},120000],['SERVICE',{service:services[0]},25000]]) {
        const resource=`bm:${version.id}:orderline`;
        const found=await provider.list(resource,ctx,{filter:{logic:'AND',conditions:[{field:'order',operator:'EQ',value:order},{field:'itemtype',operator:'EQ',value:itemtype}]}});
        if(!found.items.length) { await provider.create(resource,{order,itemtype,...extra,quantity:1,unitprice:price,total:price},ctx); created++; }
      }
      if(i<=4) await put('payment','reference',code('PAY-WIFI',i),{order,date,amount:145000,paymentmethod:'MOBILE_MONEY',status:'PAID'});
      if(i<=3) {
        await put('installation','number',code('INS-WIFI',i),{customer:customers[i-1],subscription:subscriptions[i-1],scheduleddate:date,installationdate:date,address:'Antananarivo',status:'COMPLETED',technicianname:`Technicien ${i}`});
        await put('intervention','number',code('INT-WIFI',i),{customer:customers[i-1],subscription:subscriptions[i-1],date,type:'MAINTENANCE',description:'Contrôle des connexions et du signal',status:'COMPLETED'});
      }
    }
  } else {
    const categories=[],brands=[],products=[];
    for(let i=1;i<=3;i++) categories.push(await put('category','code',code('CAT-IT',i),{name:['Ordinateurs','Périphériques','Accessoires'][i-1],active:true}));
    for(let i=1;i<=4;i++) brands.push(await put('brand','code',code('MAR-IT',i),{name:['Lenovo','Dell','HP','Logitech'][i-1],active:true}));
    for(let i=1;i<=10;i++) products.push(await put('product','reference',code('PRD-IT',i),{name:`Produit informatique ${i}`,category:categories[(i-1)%3],brand:brands[(i-1)%4],supplier:suppliers[(i-1)%3],purchaseprice:100000,saleprice:150000,stock:i<=5?9:10,minimumstock:2,active:true}));
    async function line(entity,parentField,parent,product,unitField,price,quantity) {
      const resource=`bm:${version.id}:${entity}`;
      const found=await provider.list(resource,ctx,{filter:{logic:'AND',conditions:[{field:parentField,operator:'EQ',value:parent},{field:'product',operator:'EQ',value:product}]}});
      if(!found.items.length) {await provider.create(resource,{[parentField]:parent,product,quantity,[unitField]:price,total:quantity*price},ctx);created++;}
    }
    for(let i=1;i<=3;i++) {
      const purchased = products.filter((_,index)=>index%3===i-1);
      const po=await put('purchaseorder','number',code('ACH-IT',i),{supplier:suppliers[i-1],date,status:'RECEIVED',total:purchased.length*1000000});
      for(const product of purchased) await line('purchaseorderline','purchaseorder',po,product,'unitcost',100000,10);
    }
    for(let i=1;i<=10;i++) await put('stockmovement','reference',code('STK-IT-IN',i),{product:products[i-1],type:'IN',quantity:10,date});
    for(let i=1;i<=5;i++) {
      const order=await put('customerorder','number',code('CMD-IT',i),{customer:customers[i-1],date,status:'COMPLETED',subtotal:150000,discount:0,total:150000});
      await line('customerorderline','customerorder',order,products[i-1],'unitprice',150000,1);
      const sale=await put('sale','number',code('VTE-IT',i),{customer:customers[i-1],date,subtotal:150000,discount:0,total:150000,paymentstatus:'PAID'});
      await line('saleline','sale',sale,products[i-1],'unitprice',150000,1);
      await put('stockmovement','reference',code('STK-IT-OUT',i),{product:products[i-1],type:'OUT',quantity:1,date});
      await put('payment','reference',code('PAY-IT',i),{sale,date,amount:150000,method:'CASH',status:'PAID'});
    }
  }
  console.log(JSON.stringify({ app:appCode,created,total:await prisma.businessRecord.count({where:{tenantId:app.tenantId,applicationId:app.id}}) }));
}
async function main(){assert.equal((await prisma.$queryRawUnsafe('select current_database() as name'))[0].name,target);await seed('WIFI_SERVICES','WIFI');await seed('IT_SALES','IT');}
main().catch(e=>{console.error(e.message.replaceAll(decodeURIComponent(url.password),'[REDACTED]'));process.exitCode=1;}).finally(()=>prisma.$disconnect());
