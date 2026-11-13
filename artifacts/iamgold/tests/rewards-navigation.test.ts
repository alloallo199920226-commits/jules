import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = (file: string) => readFileSync(new URL(`../src/pages/member/${file}`, import.meta.url), 'utf8');

// Exercise the existing navigation helpers and the actual toolbar callbacks,
// without loading React, stylesheets, authenticated accounts or a browser.
function navigation(start = '/home') {
  const shared = ts.createSourceFile('shared.tsx', source('shared.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const helpers = shared.statements.filter(node =>
    ts.isFunctionDeclaration(node) && node.name?.text === 'goBack' ||
    ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration =>
      ts.isIdentifier(declaration.name) && ['routes', 'goTo'].includes(declaration.name.text)));
  const print = ts.createPrinter();
  const helperCode = helpers.map(node => print.printNode(ts.EmitHint.Unspecified, node, shared))
    .join('\n').replaceAll('import.meta.env.BASE_URL', '"/"');
  const toolbarBack = (file: string, title: string) => {
    const page = ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let callback = '';
    const visit = (node: ts.Node) => {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(page) === 'RoyalToolbar') {
        const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
        if (attributes.some(attribute => attribute.name.getText(page) === 'title' &&
          attribute.initializer && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === title)) {
          const back = attributes.find(attribute => attribute.name.getText(page) === 'onBack');
          if (back?.initializer && ts.isJsxExpression(back.initializer) && back.initializer.expression)
            callback = back.initializer.expression.getText(page);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(page);
    assert.ok(callback, `Toolbar found: ${title}`);
    return callback;
  };
  const entries = [{ path: start, state: {} }];
  const window = {
    location: { get pathname() { return entries.at(-1)!.path; } },
    history: {
      get state() { return entries.at(-1)!.state; },
      back() { if (entries.length > 1) entries.pop(); },
    },
  };
  const exports: Record<string, (...args: string[]) => void> = {};
  const code = `${helperCode}
    exports.backLottery = ${toolbarBack('Lottery.tsx', 'Tirage au sort')};
    exports.backInvitation = ${toolbarBack('Team.tsx', 'Récompenses d’invitation')};`;
  runInNewContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, window,
    navigate(path: string, options: { state: object }) { entries.push({ path, state: options.state }); },
  });
  return { exports, entries, current: () => window.location.pathname };
}

test('retour : tirage → invitation → accueil, sans ajouter de pages à l’historique', () => {
  const nav = navigation();
  nav.exports.goTo('Invitation');
  nav.exports.goTo('Lottery');
  nav.exports.backLottery();
  assert.equal(nav.current(), '/invitation');
  assert.equal(nav.entries.length, 2);
  nav.exports.backInvitation();
  assert.equal(nav.current(), '/home');
  assert.equal(nav.entries.length, 1);
});

test('un tirage ouvert directement revient à l’accueil, pas à une nouvelle invitation', () => {
  const nav = navigation('/lottery');
  nav.exports.backLottery();
  assert.equal(nav.current(), '/home');
});

test('le lien Inviter des amis reste disponible sans créer de boucle de retour', () => {
  const nav = navigation();
  nav.exports.goTo('Lottery');
  nav.exports.goTo('Invitation');
  nav.exports.backInvitation();
  assert.equal(nav.current(), '/lottery');
  nav.exports.backLottery();
  assert.equal(nav.current(), '/home');
});
