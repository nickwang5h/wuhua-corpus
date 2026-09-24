import {readdir,readFile} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url));
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const corpus=pkg.name==='@wuhua/corpus';
const allowed=new Set([...Object.keys(pkg.dependencies||{}),...Object.keys(pkg.devDependencies||{})]);
function checkPath(value,file) {
 if(value.startsWith('.')) {
  const target=resolve(dirname(file),value);
  if(relative(root,target).startsWith('..'))throw new Error(`Cross-repository path in ${relative(root,file)}: ${value}`);
 } else if(!value.startsWith('node:')&&!value.startsWith('/')&&!value.includes(':')) {
  const name=value.startsWith('@')?value.split('/').slice(0,2).join('/'):value.split('/')[0];
  if(!allowed.has(name)&&!allowed.has(`@types/${name}`))throw new Error(`Undeclared dependency ${value} in ${relative(root,file)}`);
 }
}
async function scan(dir) {
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  const file=resolve(dir,entry.name);
  if(corpus&&/^(?:learning-release|curated|paths|readings)(?:\.|$)/.test(entry.name))throw new Error(`Product file in Corpus: ${file}`);
  if(entry.isDirectory())await scan(file);
  else if(/\.(?:tsx?|mjs|css)$/.test(entry.name)&&file!==fileURLToPath(import.meta.url)) {
   const text=await readFile(file,'utf8');
   if(corpus&&/\b(?:localStorage|sessionStorage|document|window|HTMLElement)\b|from\s+['"](?:react|react-dom)/.test(text))throw new Error(`Product runtime in Corpus: ${file}`);
   const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
   function walk(node) {
    if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))checkPath(node.moduleSpecifier.text,file);
    if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||node.expression.getText(ast)==='import.meta.glob')) {
     const arg=node.arguments[0];if(arg&&ts.isStringLiteral(arg))checkPath(arg.text,file);
    }
    if(ts.isNewExpression(node)&&node.expression.getText(ast)==='URL') {
     const arg=node.arguments?.[0];if(arg&&ts.isStringLiteral(arg)&&arg.text.startsWith('.'))checkPath(arg.text,file);
    }
    ts.forEachChild(node,walk);
   }walk(ast);
   if(entry.name.endsWith('.css'))for(const m of text.matchAll(/@import\s+['"]([^'"]+)/g))checkPath(m[1],file);
  }
 }
}
for(const dir of ['src','scripts','tests'])await scan(resolve(root,dir));
const config=JSON.parse(await readFile(resolve(root,'tsconfig.json'),'utf8'));
if(config.extends)checkPath(config.extends,resolve(root,'tsconfig.json'));
for(const pattern of config.include||[])if(pattern.startsWith('..'))throw new Error('Typecheck escapes repository');
for(const command of Object.values(pkg.scripts))if(/\.\.\/|(?:apps|packages)\//.test(command))throw new Error('Command escapes repository');
if(corpus&&(pkg.dependencies||Object.keys(pkg.exports).some(k=>/learning|curated|legacy|display/.test(k))))throw new Error('Product dependencies in Corpus');
console.log(`${pkg.name}: dependency boundaries pass`);
