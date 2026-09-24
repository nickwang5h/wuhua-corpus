import test from 'node:test';
import assert from 'node:assert/strict';
import {wrapText,continuousExcerpt} from '../src/ui/text-layout';
test('measured share wrapping preserves line breaks and punctuation without rewriting',()=>{
 const text='学而时习之，学而时习之。\n「学」，不亦说乎？！';const lines=wrapText(text,7,s=>Array.from(s).length);assert.equal(lines.join(''),text.replaceAll('\n',''));assert.ok(lines.every(s=>! /^[，。！？！」]/.test(s)));assert.ok(lines.every(s=>Array.from(s).length<=7));assert.ok(continuousExcerpt('学而时习之，学而时习之。','学而时习之，\n学而时习之。'));assert.equal(continuousExcerpt('学而时习之。','习而学'),false);
});
