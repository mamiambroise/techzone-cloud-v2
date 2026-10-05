const {test}=require('node:test'),assert=require('node:assert/strict');
const {apps}=require('./ph7-spec.cjs');
test('two complete declarative schemas with consistent relation targets',()=>{
  assert.deepEqual(apps.map(a=>a.entities.length),[11,13]);
  assert.deepEqual(apps.map(a=>a.entities.reduce((n,e)=>n+e.fields.length,0)),[74,77]);
  for(const app of apps){
    const codes=new Set(app.entities.map(e=>e.code));assert.equal(codes.size,app.entities.length);
    for(const entity of app.entities){
      assert.equal(new Set(entity.fields.map(f=>f.code)).size,entity.fields.length);
      for(const field of entity.fields){if(field.target)assert(codes.has(field.target));if(field.values)assert(field.values.length>1);}
    }
  }
});
