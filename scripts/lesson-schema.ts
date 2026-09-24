import {z} from 'zod';
import {parseDocument} from 'yaml';
const text=z.string().refine(s=>!!s.trim()&&!s.includes('TODO:'),'填写实际内容，替换 TODO 占位');
const id=text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const review=z.strictObject({status:z.enum(['draft','reviewed','published','withdrawn']),author:text,reviewer:text.optional(),reviewedAt:text.optional(),textVersion:text}).superRefine((r,c)=>{
 if(['reviewed','published'].includes(r.status)&&(!r.reviewer||!r.reviewedAt))c.addIssue({code:'custom',message:'审核状态需要真实 reviewer 和 reviewedAt'});
});
const rights=z.strictObject({author:text,license:text,source:z.url({protocol:/^https?$/}).refine(s=>!new URL(s).hostname.endsWith("example.com"),"填写实际来源链接").optional(),edition:text.optional(),note:text.optional()});
const section=z.strictObject({id,target:id,version:text,start:z.int().nonnegative(),end:z.int().positive(),text,review,rights});
export const lessonSchema=z.strictObject({
 schemaVersion:z.literal(1),order:z.int().nonnegative(),
 lesson:z.strictObject({id,version:text,title:text,level:z.enum(['Starting','Building']),goal:text,prerequisites:z.array(id),intro:text.optional(),refs:z.array(z.strictObject({id,version:text,start:z.int().nonnegative(),end:z.int().positive(),label:text})).min(1),exercises:z.array(z.strictObject({id,type:z.enum(['meaning','context']),prompt:text,options:z.array(text).min(2),answer:z.int().nonnegative(),feedback:text})).min(1),reflection:text,review,compatibleVersions:z.array(text),pinyinAidIds:z.array(id).min(1)}),
 sections:z.strictObject({meaning:section,wordsToNotice:section,context:section,teachingParaphrase:section.optional()})
});
export const sectionKinds={meaning:'translation-en',wordsToNotice:'vocabulary-en',context:'culture-en',teachingParaphrase:'adaptation-zh'} as const;
export function parseLesson(source:string,filename:string){
 const doc=parseDocument(source,{uniqueKeys:true,stringKeys:true});
 if(doc.errors.length||doc.warnings.length)throw new Error(`${filename}: ${[...doc.errors,...doc.warnings].map(e=>e.message).join('; ')}`);
 const raw=doc.toJS({maxAliasCount:0});const result=lessonSchema.safeParse(raw);
 if(!result.success)throw new Error(`${filename}:\n${result.error.issues.map(e=>`${e.path.join('.')}: ${e.message}`).join('\n')}`);
 const {lesson,sections,order}=result.data;
 // Preserve existing aid order while keeping named authoring sections.
 const aids=(Object.keys(raw.sections) as (keyof typeof sectionKinds)[]).map(key=>({...sections[key]!,kind:sectionKinds[key]}));
 const unit={...lesson,intro:lesson.intro??lesson.goal,aids};
 for(const e of unit.exercises)if(e.answer>=e.options.length)throw new Error(`${filename}: exercises.${e.id}.answer 超出选项范围`);
 for(const a of aids){if(a.review.textVersion!==a.version)throw new Error(`${filename}: ${a.id} 审核原文版本不一致`);if(!a.rights.source||!a.rights.edition||!a.rights.note)throw new Error(`${filename}: ${a.id} 需要具体对照来源、版本及使用说明`);}
 return {order,unit};
}
