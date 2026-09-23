export type WorkId = 'zhuangzi' | 'laozi' | 'lunyu';
export type Work = { id: WorkId; title: string; roman: string; subtitle: string; description: string; color: string; symbol: string };
export type Source = {
 id: string; provider: 'legacy' | 'wikisource'; url: string | null; revision: string | null;
 edition: string | null;
 rights: { status: 'unverified' | 'public-domain' | 'licensed'; license: string | null; evidenceUrl: string | null; verifiedAt: string | null };
 processing: { imported: boolean; normalized: boolean; punctuationModified: boolean | null; manuallyVerified: boolean };
};
export type Edition = { id: string; workId: WorkId; sourceId: string; title: string; status: 'draft' | 'verified' };
export type Division = { id: string; editionId: string; title: string; number: number; kind: 'essay' | 'chapter' | 'sayings' };
export type CanonicalPassage = { id: string; divisionId: string; locator: string; sentences: { id: string; text: string }[]; referenceUrl: string };
// Editorial content is separately versioned and is not a historical quotation.
export type Annotation = {
 id: string; target: string; author: string; status: 'draft' | 'reviewed';
 displayLines: string[]; terms: { word: string; pinyin: string; meaning: string }[];
 translation: string; thought: string; context: string; prompt: string; concepts: string[];
};
export type Concept = { description: string; related: string[] };
export type ReadingPath = { id: string; title: string; intro: string; ids: string[]; label: string };
export type Catalog = { works: Work[]; sources: Source[]; editions: Edition[]; divisions: Division[]; passages: CanonicalPassage[]; annotations: Annotation[]; concepts: Record<string, Concept>; paths: ReadingPath[] };
