// Données synthétiques CDC Boutique. Aucun reset, publication ou modification d'existant.
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const { Client } = require(path.join(root, 'backend/node_modules/pg'));
const dotenv = require(path.join(root, 'backend/node_modules/dotenv'));
const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend/.env')));
const url = new URL(env.DATABASE_URL);
const schema = url.searchParams.get('schema') || 'business_manager';
url.searchParams.delete('schema');
const apply = process.argv.includes('--apply');
const withAdmin = process.argv.includes('--with-admin');
const adminFile = path.join(root, '.env.boutique-admin');
const id = (key) => {
  const s = createHash('sha256').update('techzone-boutique-cdc-v1.1:' + key).digest('hex');
  return `${s.slice(0,8)}-${s.slice(8,12)}-4${s.slice(13,16)}-a${s.slice(17,20)}-${s.slice(20,32)}`;
};
const q = (s) => '"' + s.replaceAll('"', '""') + '"';
const marker = 'CDC_BOUTIQUE_V1_1_SYNTHETIC';
const specs = {
  Category: 'code name parentId:Category? status',
  Brand: 'code name status',
  Product: 'sku name categoryId:Category brandId:Brand purchasePrice:$ salePrice:$ minStock:# status',
  ProductVariant: 'productId:Product barcode color size priceAdjustment:$',
  Supplier: 'code name phone country status',
  PurchaseOrder: 'reference supplierId:Supplier orderDate:@ expectedDate:@ total:$ status',
  PurchaseOrderLine: 'purchaseOrderId:PurchaseOrder productId:Product quantity:# unitCost:$ receivedQuantity:#',
  GoodsReceipt: 'reference purchaseOrderId:PurchaseOrder receiptDate:@ status',
  Warehouse: 'code name location status',
  InventoryBalance: 'warehouseId:Warehouse productId:Product quantityOnHand:# reservedQuantity:#',
  StockMovement: 'reference productId:Product warehouseId:Warehouse type quantity:# sourceReference createdAt:@',
  StockTransfer: 'reference sourceWarehouseId:Warehouse destinationWarehouseId:Warehouse status',
  Customer: 'code name phone email creditLimit:$ status',
  Sale: 'reference customerId:Customer saleDate:@ subtotal:$ discount:$ total:$ status',
  SaleLine: 'saleId:Sale productId:Product quantity:# unitPrice:$ discount:$ subtotal:$',
  Return: 'reference saleId:Sale reason status refundAmount:$',
  ReturnLine: 'returnId:Return saleLineId:SaleLine quantity:# condition',
  Payment: 'reference saleId:Sale amount:$ method status paidAt:@',
  PaymentAllocation: 'paymentId:Payment saleId:Sale allocatedAmount:$',
  CustomerReceivable: 'customerId:Customer saleId:Sale originalAmount:$ remainingAmount:$ dueDate:@ status',
  Delivery: 'reference saleId:Sale address deliveryDate:@ status',
  DeliveryLine: 'deliveryId:Delivery saleLineId:SaleLine quantity:# deliveredQuantity:#',
  BusinessAuditEvent: 'actorId tenantId entityType entityId action occurredAt:@',
};
// Le CDC annonce 25 modèles mais ses tableaux en énumèrent réellement 23.
const fixtures = [];
function row(model, key, data) { fixtures.push({ model, key, data }); return id('record:' + key); }
const now = '2026-10-19T09:00:00.000Z';
const category = row('Category', 'accessoires', {code:'ACCESSOIRES',name:'Accessoires informatiques',status:'ACTIVE',parentId:null});
row('Category', 'peripheriques', {code:'PERIPHERIQUES',name:'Périphériques',parentId:category,status:'ACTIVE'});
const brand = row('Brand','techzone',{code:'TZ',name:'Techzone Test',status:'ACTIVE'});
const products = {};
for (const [sku,name,cost,price,minStock] of [
  ['SOURIS-USB','Souris USB',12000,20000,5],['CLAVIER','Clavier',25000,40000,3],
  ['WEBCAM','Webcam',45000,65000,3],['HDMI','Câble HDMI',8000,15000,5],
  ['ROUTEUR','Routeur dernière unité',70000,100000,1],['CASQUE','Casque audio',20000,35000,2],
  ['ALPHA-LOT','Lot informatique Société Alpha',350000,500000,1],['INACTIF','Produit inactif',10000,20000,0],
]) products[sku] = row('Product',sku,{sku,name,categoryId:category,brandId:brand,purchasePrice:cost,salePrice:price,minStock,status:sku==='INACTIF'?'INACTIVE':'ACTIVE'});
row('ProductVariant','clavier-noir',{productId:products.CLAVIER,barcode:'TZ-CLAVIER-NOIR',color:'Noir',size:'Standard',priceAdjustment:0});
const supplier = row('Supplier','supplier',{code:'FOURN-LOCAL',name:'Fournisseur local de recette',phone:'+261340000001',country:'MG',status:'ACTIVE'});
const depot = row('Warehouse','depot',{code:'DEPOT',name:'Dépôt principal',location:'Antananarivo',status:'ACTIVE'});
const magasin = row('Warehouse','magasin',{code:'MAGASIN',name:'Magasin',location:'Antananarivo',status:'ACTIVE'});
for (const [sku,qty] of [['SOURIS-USB',0],['CLAVIER',10],['WEBCAM',3],['HDMI',20],['ROUTEUR',1],['CASQUE',7],['ALPHA-LOT',2],['INACTIF',4]]) row('InventoryBalance','stock-mag-'+sku,{warehouseId:magasin,productId:products[sku],quantityOnHand:qty,reservedQuantity:0});
row('InventoryBalance','stock-depot-webcam',{warehouseId:depot,productId:products.WEBCAM,quantityOnHand:20,reservedQuantity:0});
const customer = row('Customer','comptoir',{code:'COMPTANT',name:'Client comptoir',phone:'+261340000002',email:'comptoir@tests.invalid',creditLimit:0,status:'ACTIVE'});
const alpha = row('Customer','alpha',{code:'ALPHA',name:'Société Alpha',phone:'+261340000003',email:'alpha@tests.invalid',creditLimit:1000000,status:'ACTIVE'});
const po = row('PurchaseOrder','sc01-po',{reference:'CDC-SC01-ACHAT',supplierId:supplier,orderDate:now,expectedDate:'2026-10-26T09:00:00.000Z',total:360000,status:'DRAFT'});
row('PurchaseOrderLine','sc01-line',{purchaseOrderId:po,productId:products['SOURIS-USB'],quantity:30,unitCost:12000,receivedQuantity:0});
row('StockTransfer','sc04-transfer',{reference:'CDC-SC04-TRANSFERT',sourceWarehouseId:depot,destinationWarehouseId:magasin,status:'DRAFT'});
const sale02 = row('Sale','sc02-sale',{reference:'CDC-SC02-VENTE',customerId:customer,saleDate:now,subtotal:190000,discount:9500,total:180500,status:'DRAFT'});
for (const [sku,quantity,unitPrice] of [['CLAVIER',2,40000],['WEBCAM',1,65000],['HDMI',3,15000]]) row('SaleLine','sc02-'+sku,{saleId:sale02,productId:products[sku],quantity,unitPrice,discount:0,subtotal:quantity*unitPrice});
const sale03 = row('Sale','sc03-sale',{reference:'CDC-SC03-ALPHA',customerId:alpha,saleDate:now,subtotal:500000,discount:0,total:500000,status:'DRAFT'});
const alphaLine = row('SaleLine','sc03-line',{saleId:sale03,productId:products['ALPHA-LOT'],quantity:1,unitPrice:500000,discount:0,subtotal:500000});
const sale06 = row('Sale','sc06-sale',{reference:'CDC-SC06-HISTORIQUE',customerId:customer,saleDate:now,subtotal:105000,discount:0,total:105000,status:'CONFIRMED'});
row('SaleLine','sc06-line',{saleId:sale06,productId:products.CASQUE,quantity:3,unitPrice:35000,discount:0,subtotal:105000});
const payment = row('Payment','sc06-payment',{reference:'CDC-SC06-ESPECES',saleId:sale06,amount:105000,method:'CASH',status:'COMPLETED',paidAt:now});
row('PaymentAllocation','sc06-allocation',{paymentId:payment,saleId:sale06,allocatedAmount:105000});
row('StockMovement','sc06-out',{reference:'CDC-SC06-SORTIE',productId:products.CASQUE,warehouseId:magasin,type:'OUT',quantity:3,sourceReference:'CDC-SC06-HISTORIQUE',createdAt:now});
row('Delivery','sc03-delivery',{reference:'CDC-SC03-LIVRAISON',saleId:sale03,address:'Société Alpha, Antananarivo',deliveryDate:'2026-10-27T09:00:00.000Z',status:'DRAFT'});
const delivery = id('record:sc03-delivery');
row('DeliveryLine','sc03-delivery-line',{deliveryId:delivery,saleLineId:alphaLine,quantity:1,deliveredQuantity:0});

async function main() {
  const client = new Client({connectionString:url.toString(),connectionTimeoutMillis:5000});
  const counts = {created:{},reused:{}};
  const missingColumns = [];
  let adminReport;
  const columns = {};
  const table = name => `${q(schema)}.${q(name)}`;
  async function ensure(name, data, key = {id:data.id}) {
    if(!columns[name]) columns[name] = new Set((await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',[schema,name])).rows.map(r=>r.column_name));
    for(const col of ['applicationId','applicationVersionId']) {
      if(name.startsWith('pm_') && col in data && !columns[name].has(col)) {
        missingColumns.push(name+'.'+col); delete data[col];
      }
    }
    const keys = Object.keys(key);
    const found = await client.query(`SELECT * FROM ${table(name)} WHERE ${keys.map((k,i)=>`${q(k)}=$${i+1}`).join(' AND ')}`,Object.values(key));
    if(found.rowCount) { counts.reused[name]=(counts.reused[name]||0)+1; return found.rows[0]; }
    const cols = Object.keys(data);
    const result = await client.query(`INSERT INTO ${table(name)} (${cols.map(q)}) VALUES (${cols.map((_,i)=>'$'+(i+1))}) RETURNING *`,Object.values(data).map(v=>v && typeof v==='object' ? JSON.stringify(v):v));
    counts.created[name]=(counts.created[name]||0)+1; return result.rows[0];
  }
  try {
    await client.connect();
    const actual = (await client.query('SELECT current_database() AS db')).rows[0].db;
    if(actual!==decodeURIComponent(url.pathname.slice(1)) || /(^|[_-])(prod|production)([_-]|$)/i.test(actual)) throw new Error('REFUSED_DATABASE_TARGET');
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('CDC_BOUTIQUE_V1_1_SYNTHETIC'))");
    const timestamp = new Date().toISOString();
    const tenants = [];
    for(const suffix of ['A','B']) {
      const tenant = await ensure('tenant',{id:id('tenant:'+suffix),code:'TENANT_BOUTIQUE_'+suffix,name:'Boutique '+suffix,status:'ACTIVE',locale:'fr-MG',timezone:'Indian/Antananarivo',metadata:{seed:marker},updatedAt:timestamp},{code:'TENANT_BOUTIQUE_'+suffix});
      tenants.push(tenant);
      // La base actuelle impose un code application globalement unique.
      const appCode = suffix==='A'?'TECHZONE_BOUTIQUE':'TECHZONE_BOUTIQUE_CONTROLE';
      const app = await ensure('applications',{id:id('app:'+suffix),tenantId:tenant.id,code:appCode,name:'Techzone Boutique Pro',description:marker,updatedAt:timestamp},{tenantId:tenant.id,code:appCode});
      const versions = {};
      for(const version of ['1.0.0','1.1.0']) versions[version]=await ensure('application_versions',{id:id('version:'+suffix+version),applicationId:app.id,tenantId:tenant.id,version,status:'DRAFT',releaseNotes:'Données de préparation CDC ; publication NOT TESTED'},{applicationId:app.id,version});
      const v = versions['1.1.0'];
      if(v.status!=='DRAFT') throw new Error('REFUSED: version 1.1.0 existante non DRAFT');
      const entities = {};
      for(const model of Object.keys(specs)) {
        const existing = await client.query(`SELECT * FROM ${table('bm_entities')} WHERE "tenantId"=$1 AND "applicationId"=$2 AND "applicationVersionId"=$3 AND lower(code)=lower($4)`,[tenant.id,app.id,v.id,model]);
        if(existing.rowCount>1) throw new Error('Ambiguous model '+model);
        entities[model] = existing.rows[0] || await ensure('bm_entities',{id:id('entity:'+suffix+model),applicationId:app.id,applicationVersionId:v.id,tenantId:tenant.id,code:model,name:model,version:'1.1.0',status:'DRAFT',description:marker,updatedAt:timestamp});
      }
      for(const [model,definition] of Object.entries(specs)) {
        for(const [position,spec] of definition.split(' ').entries()) {
          const [code,kind=''] = spec.split(':');
          const target = kind.replace('?','');
          const relation = entities[target];
          const type = relation ? 'UUID' : ({'$':'CURRENCY','#':'INTEGER','@':'DATETIME'}[kind]||'TEXT');
          await ensure('bm_fields',{id:id('field:'+suffix+model+code),entityId:entities[model].id,tenantId:tenant.id,code,label:code,type,required:!kind.endsWith('?'),unique:['code','sku','reference','barcode'].includes(code),position,version:'1.1.0',updatedAt:timestamp},{entityId:entities[model].id,code});
          if(relation) await ensure('bm_relations',{id:id('relation:'+suffix+model+code),tenantId:tenant.id,applicationVersionId:v.id,sourceEntityId:entities[model].id,targetEntityId:relation.id,code,relationType:'MANY_TO_ONE',required:!kind.endsWith('?'),deleteBehavior:'RESTRICT',configuration:{sourceField:code,targetField:'id'},version:'1.1.0',updatedAt:timestamp},{applicationVersionId:v.id,sourceEntityId:entities[model].id,targetEntityId:relation.id,code});
        }
      }
      // B conserve une vente témoin distincte ; aucun mélange d'identifiants A/B.
      const selected = suffix==='A' ? fixtures : fixtures.filter(f=>['accessoires','techzone','comptoir','CLAVIER'].includes(f.key));
      if(suffix==='B') selected.push({model:'Sale',key:'b-sale',data:{reference:'CDC-SC07-TENANT-B',customerId:id('record:comptoir'),saleDate:now,subtotal:40000,discount:0,total:40000,status:'DRAFT'}});
      for(const f of selected) {
        const data=Object.fromEntries(Object.entries(f.data).map(([k,value])=>[k,suffix==='B' && typeof value==='string' && fixtures.some(r=>id('record:'+r.key)===value) ? id('record:B:'+fixtures.find(r=>id('record:'+r.key)===value).key):value]));
        await ensure('business_records',{id:id('record:'+(suffix==='B'?'B:':'')+f.key),tenantId:tenant.id,applicationId:app.id,entityId:entities[f.model].id,entityCode:entities[f.model].code,schemaVersion:'1.1.0',data,createdBy:marker,updatedBy:marker,updatedAt:timestamp});
      }
      const pack=await ensure('pm_packs',{id:id('pack:'+suffix),tenantId:tenant.id,applicationId:app.id,code:'PACK_BOUTIQUE_VENTE',name:'Pack Boutique Vente',createdBy:marker,updatedAt:timestamp},{tenantId:tenant.id,code:'PACK_BOUTIQUE_VENTE'});
      for(const version of ['1.0.0','1.1.0']) await ensure('pm_pack_versions',{id:id('pack-version:'+suffix+version),tenantId:tenant.id,packId:pack.id,applicationVersionId:versions[version].id,versionNumber:version,createdBy:marker,updatedAt:timestamp},{tenantId:tenant.id,packId:pack.id,versionNumber:version});
    }
    if (withAdmin) {
      const bcrypt = require(path.join(root, 'backend/node_modules/bcrypt'));
      const username = 'boutique.recette.admin';
      const email = 'boutique.recette.admin@tests.invalid';
      const userId = id('iam:admin');
      const existing = await client.query(`SELECT * FROM ${table('iam_user')} WHERE id=$1 OR username=$2 OR "primaryEmail"=$3`, [userId, username, email]);
      if (existing.rowCount && (existing.rowCount !== 1 || existing.rows[0].id !== userId || existing.rows[0].metadata?.seed !== marker)) {
        throw new Error('ADMIN_IDENTITY_CONFLICT: aucun compte existant ne sera promu');
      }
      if (existing.rowCount) {
        const user = existing.rows[0];
        if (user.status !== 'ACTIVE' || !user.isAdmin || user.archivedAt || user.username !== username || user.primaryEmail !== email) throw new Error('ADMIN_STATE_CONFLICT: compte existant conservé sans modification');
        const credential = await client.query(`SELECT id FROM ${table('iam_credential')} WHERE "userId"=$1 AND type='PASSWORD' AND status='ACTIVE'`, [userId]);
        if (!credential.rowCount) throw new Error('ADMIN_PASSWORD_MISSING: utiliser la récupération IAM');
      }
      let password;
      if (!existing.rowCount) {
        const saved = fs.existsSync(adminFile) ? dotenv.parse(fs.readFileSync(adminFile)) : {};
        if (fs.existsSync(adminFile) && (!saved.BOUTIQUE_ADMIN_PASSWORD || saved.BOUTIQUE_ADMIN_USERNAME !== username)) throw new Error('ADMIN_CREDENTIAL_FILE_CONFLICT');
        password = saved.BOUTIQUE_ADMIN_PASSWORD || randomBytes(24).toString('base64url');
        if (password.length < 10 || password.length > 128) throw new Error('ADMIN_PASSWORD_INVALID_LENGTH');
        // Le secret est sauvegardé avant COMMIT afin de ne jamais créer un compte
        // dont le mot de passe serait perdu. Un rollback peut laisser ce fichier réutilisable.
        if (apply && !fs.existsSync(adminFile)) fs.writeFileSync(adminFile, `BOUTIQUE_ADMIN_USERNAME=${username}\nBOUTIQUE_ADMIN_PASSWORD=${password}\n`, {flag:'wx', mode:0o600});
        if (apply) fs.chmodSync(adminFile, 0o600);
        const hash = await bcrypt.hash(password, 12);
        await ensure('iam_user', {id:userId, username, primaryEmail:email, displayName:'Administrateur recette Boutique', status:'ACTIVE', isAdmin:true, defaultTenantId:tenants[0].id, metadata:{seed:marker}, createdBy:marker, updatedAt:timestamp});
        await ensure('iam_credential', {id:id('iam:admin:password'), userId, type:'PASSWORD', status:'ACTIVE', secretHash:hash, createdBy:marker, updatedAt:timestamp});
        await ensure('iam_password_history', {id:id('iam:admin:history'), userId, passwordHash:hash});
      } else {
        counts.reused.iam_user = (counts.reused.iam_user || 0) + 1;
      }
      for (const tenant of tenants) {
        const membership = await ensure('membership', {id:id('iam:admin:membership:'+tenant.code), userId, tenantId:tenant.id, status:'ACTIVE', joinedAt:timestamp, metadata:{seed:marker}, createdBy:marker, updatedAt:timestamp}, {userId, tenantId:tenant.id});
        if (membership.status !== 'ACTIVE' || membership.organizationId || membership.siteId || membership.validFrom && new Date(membership.validFrom) > new Date() || membership.validUntil && new Date(membership.validUntil) < new Date()) throw new Error('ADMIN_MEMBERSHIP_CONFLICT: appartenance existante conservée sans modification');
      }
      adminReport = {username, status:existing.rowCount?'REUSED':apply?'CREATED':'WOULD_CREATE', platformAdmin:true, tenants:tenants.map(t=>t.code), credentialsFile:'.env.boutique-admin', passwordPrinted:false};
    }
    await client.query(apply?'COMMIT':'ROLLBACK');
    const report={database:actual,schema,mode:apply?'APPLIED':'DRY_RUN_ROLLED_BACK',modelsPerTenant:Object.keys(specs).length,recordsA:fixtures.length,recordsB:5,counts,missingColumns:[...new Set(missingColumns)],acceptance:'NOT TESTED',limitations:['Le CDC liste 23 modèles malgré son total annoncé de 25.','Modèles et packs DRAFT ; pas de contrat ou publication simulés.','IAM/RBAC, pages, règles métier et concurrence à valider par API/UI.','SC06 est un historique synthétique, pas une preuve de transaction exécutée.']};
    if (adminReport) report.admin = adminReport;
    console.log(JSON.stringify(report,null,2));
    if(apply) fs.writeFileSync(path.join(root,'docs/recette/boutique-seed-result.json'),JSON.stringify(report,null,2)+'\n');
  } catch(error) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error(JSON.stringify({status:'BLOCKED',code:error.code,message:error.message})); process.exitCode=1;
  } finally { await client.end(); }
}
main();
