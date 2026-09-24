import {catalog} from './legacy/catalog';
export const curated = catalog.passages.map(p=>{
 const division=catalog.divisions.find(d=>d.id===p.divisionId)!;
 const edition=catalog.editions.find(e=>e.id===division.editionId)!;
 const annotation=catalog.annotations.find(a=>a.target===p.id);
 return {id:p.id,version:'legacy-1',book:edition.workId,title:`${catalog.works.find(w=>w.id===edition.workId)?.title||edition.workId} · ${p.locator}`,text:p.sentences.map(s=>s.text).join(''),source:p.referenceUrl,annotation};
});
export const curatedById:Record<string,typeof curated[number]>=Object.assign(Object.create(null),Object.fromEntries(curated.map(p=>[p.id,p])));
