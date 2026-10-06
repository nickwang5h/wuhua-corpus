import type {TextBook} from '../src/types.js';

export type EditorialMetadata = Record<string,{author:string;era:string}>;
const legacyTitles:Record<string,string>={laozi:'老子',lunyu:'论语',zhuangzi:'庄子'};

export function applyMetadata(input:TextBook,metadata:EditorialMetadata):TextBook{
 const entry=metadata[input.id];
 if(!entry)return input;
 if(!entry.author?.trim()||!entry.era?.trim())throw new Error(`Incomplete editorial metadata: ${input.id}`);
 const title=input.metadata?.title??legacyTitles[input.id];
 if(!title)throw new Error(`Missing metadata title: ${input.id}`);
 return {...input,metadata:{...input.metadata,title,...entry,metadataMethod:'editorial',needsReview:false}};
}
