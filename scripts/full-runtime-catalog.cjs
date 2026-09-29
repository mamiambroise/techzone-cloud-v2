const fs = require('node:fs');
const {Client} = require('../backend/node_modules/pg');
const env = require('../backend/node_modules/dotenv').parse(fs.readFileSync('backend/.env'));
(async()=>{
 const out={timestamp:new Date().toISOString(),attempts:[]};
 for(let i=0;i<3;i++){
  const c=new Client({connectionString:process.env.DATABASE_URL||env.DATABASE_URL,connectionTimeoutMillis:5000,query_timeout:5000});
  try{
   await c.connect();
   out.tables=(await c.query("SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema = ANY($1) ORDER BY 1,2",[['business_manager','auth_aim','erp_adapter']])).rows;
   out.accounts=[];
   out.columns=(await c.query("SELECT table_schema,table_name,column_name,data_type,udt_schema,udt_name FROM information_schema.columns WHERE table_schema = ANY($1) ORDER BY 1,2,ordinal_position",[['business_manager','auth_aim','erp_adapter']])).rows;
   for(const [s,t] of [['business_manager','iam_user'],['auth_aim','User'],['erp_adapter','iam_user']]) if(out.tables.some(row=>row.table_schema===s&&row.table_name===t)) {
    const rows=(await c.query(`SELECT id, username, status FROM "${s}"."${t}" WHERE username=$1`,['techzonetest'])).rows;
    out.accounts.push({schema:s,table:t,users:rows});
    if(s==='auth_aim'&&rows.length){
     out.testMemberships=(await c.query('SELECT m.status, t.code AS "tenantCode", t.status AS "tenantStatus" FROM auth_aim."Membership" m JOIN auth_aim."Tenant" t ON t.id=m."tenantId" WHERE m."userId"=$1',[rows[0].id])).rows;
     out.testRoles=(await c.query('SELECT r.code, r.name FROM auth_aim."RoleAssignment" a JOIN auth_aim."Role" r ON r.id=a."roleId" WHERE a."userId"=$1',[rows[0].id])).rows;
    }
   }
   out.attempts.push('PASS');break;
  }catch(e){out.attempts.push({code:e.code||'NETWORK_TIMEOUT'});}finally{await c.end().catch(()=>{});}
 }
 fs.writeFileSync('docs/full-runtime-review/catalog.json',JSON.stringify(out,null,2));console.log(JSON.stringify({attempts:out.attempts,tables:out.tables?.length,accounts:out.accounts}));
})().catch(e=>console.log(JSON.stringify({error:e.code||e.name})));
