import {createContext, useContext} from 'react';
import type {Reference} from '@wuhua/corpus/types';
import type {Settings} from '../ui/data';
import type {Reading} from '../reading/schema';
import {Phrase} from './Phrase';
import {ClassicQuote} from './ClassicQuote';
export const ReadingContext = createContext<{
  reading:Reading; references:Record<string,Reference>; settings:Settings; showDraftPinyin:boolean;
} | null>(null);
export function useReading() {
  const context = useContext(ReadingContext);
  if (!context) throw new Error('Reading components need ReadingLayout');
  return context;
}
export const mdxComponents = {Phrase, ClassicQuote};
