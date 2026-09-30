const text = (key,label,extra = {}) => ({ key,label,...extra });
const choice = (key,label,options,extra = {}) => text(key,label,{ options,...extra });
const base = [text('code','Code',{ required:true }),text('name','Nom',{ required:true }),text('description','Description')];
export const packFields = base;
export const versionFields = [text('versionNumber','Version SemVer',{ required:true,default:'1.0.0' }),text('label','Libellé'),text('releaseNotes','Notes de version')];
export function resourceFields(section, version, capabilities) {
  const targets = [...(version?.modules ?? []),...(version?.features ?? [])].map(r => ({ value:r.code,label:r.name + ' (' + r.code + ')' }));
  if (section === 'modules') return [...base,text('enabled','Activé',{ type:'checkbox',default:true }),text('displayOrder','Ordre',{ type:'number',default:0 }),text('configuration','Configuration publique (JSON)',{ type:'json' })];
  if (section === 'features') return [...base,choice('moduleId','Module',(version?.modules ?? []).map(m => ({ value:m.id,label:m.name }))),text('enabled','Activée',{ type:'checkbox',default:true }),text('defaultEnabled','Activée par défaut',{ type:'checkbox',default:true })];
  if (section === 'capabilities') return [...base,text('contractRef','Référence de contrat'),text('contractVersion','Version du contrat')];
  if (section === 'attach') return [choice('capabilityId','Capacité',capabilities.map(c => ({ value:c.id,label:c.name })),{ required:true }),choice('relationType','Association',['PROVIDES','REQUIRES','USES'],{ default:'REQUIRES',required:true }),text('required','Obligatoire',{ type:'checkbox',default:true })];
  if (section === 'dependencies') return [choice('sourceType','Type source',['MODULE','FEATURE','PACK'],{ required:true }),choice('sourceId','Source',targets,{ required:true }),choice('dependencyType','Relation',['REQUIRED','OPTIONAL','CONFLICTS_WITH','RECOMMENDS','IMPLIES'],{ default:'REQUIRED',required:true }),choice('targetType','Type cible',['MODULE','FEATURE','CAPABILITY','PACK'],{ required:true }),text('targetRef','Code cible',{ required:true }),text('targetVersionRange','Contrainte SemVer'),text('required','Obligatoire',{ type:'checkbox',default:true }),text('reason','Motif')];
  if (section === 'rules') return [...base,choice('targetType','Type cible',['MODULE','FEATURE'],{ required:true }),choice('targetId','Cible',targets,{ required:true }),choice('effect','Effet',['ENABLE','DISABLE','DENY','REQUIRE'],{ required:true }),text('priority','Priorité',{ type:'number',default:0 }),text('enabled','Activée',{ type:'checkbox',default:true }),text('expression','Conditions déclaratives (JSON)',{ type:'json',default:'{"field":"environment.code","operator":"EQ","value":"DEV"}' })];
  return [];
}
