import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import * as wordFields from '../src/lib/wordFields.ts';

const compiled = ts.transpileModule(fs.readFileSync(new URL('../src/lib/languageStore.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture({ folder = {}, words = [], failCommit = false, failScan = false } = {}) {
  const reads = [];
  const directUpdates = [];
  const batches = [];
  const sdk = {
    collection: (_db, path) => ({ path }),
    doc: (first, ...parts) => parts.length ? { path: parts.join('/'), id: parts.at(-1) } : { path: `${first.path}/generated`, id: 'generated' },
    serverTimestamp: () => 'server-time',
    arrayUnion: (...items) => ({ union: items }),
    getDoc: async (ref) => { reads.push(ref.path); return { exists: () => true, data: () => folder }; },
    getDocs: async (ref) => {
      reads.push(ref.path);
      if (failScan) throw new Error('scan failed');
      return { docs: words.map((data) => ({ data: () => data })) };
    },
    updateDoc: async (ref, data) => { directUpdates.push({ ref, data }); },
    writeBatch: () => {
      const operations = [];
      return {
        set: (ref, data) => operations.push({ method: 'set', ref, data }),
        update: (ref, data) => operations.push({ method: 'update', ref, data }),
        commit: async () => {
          if (failCommit) throw new Error('commit failed');
          batches.push(operations);
        },
      };
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === 'firebase/firestore') return sdk;
      if (name === '@/lib/firebase') return { db: {} };
      if (name === '@/lib/wordFields') return wordFields;
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { store: exports, reads, directUpdates, batches };
}

test('initialized folders reuse their own catalog without scanning words', async () => {
  const f = fixture({ folder: { customFieldNamesInitialized: true, customFieldNames: ['Gender', ' Gender '] } });
  assert.deepEqual(await f.store.getCustomFieldNames('germanwords'), ['Gender']);
  assert.deepEqual(f.reads, ['languages/germanwords']);
  assert.equal(f.directUpdates.length, 0);
});

test('first use discovers old field names once and merges the folder catalog', async () => {
  const f = fixture({ folder: { customFieldNames: ['Note'] }, words: [{ fields: { gender: 'die' } }, { customFields: [{ label: 'Note', value: 'a' }] }] });
  const names = await f.store.getCustomFieldNames('germanwords');
  assert.equal(names.length, 2);
  assert.equal(names[0], 'Note');
  assert.equal(names[1], '\uC131 / \uAD00\uC0AC');
  assert.deepEqual(f.reads, ['languages/germanwords', 'germanwords']);
  assert.equal(f.directUpdates[0].ref.path, 'languages/germanwords');
  assert.equal(f.directUpdates[0].data.customFieldNamesInitialized, true);
  assert.deepEqual(f.directUpdates[0].data.customFieldNames.union, Array.from(names));
});

test('failed legacy scan leaves initialization retryable', async () => {
  const f = fixture({ failScan: true });
  await assert.rejects(f.store.getCustomFieldNames('japanesewords'), /scan failed/);
  assert.equal(f.directUpdates.length, 0);
});

test('word creation batches custom values with only the selected folder catalog', async () => {
  const f = fixture();
  const id = await f.store.createWord('folder-a', { word: ' word ', meaning: 'meaning', customFields: [{ label: ' Gender ', value: ' die ' }] });
  assert.equal(id, 'generated');
  assert.equal(f.batches.length, 1);
  const [word, catalog] = f.batches[0];
  assert.equal(word.ref.path, 'folder-a/generated');
  assert.equal(word.data.word, 'word');
  assert.deepEqual(word.data.customFields, [{ label: 'Gender', value: 'die' }]);
  assert.equal(catalog.ref.path, 'languages/folder-a');
  assert.deepEqual(catalog.data.customFieldNames.union, ['Gender']);
});

test('editing clears old custom fields without forgetting reusable folder names', async () => {
  const f = fixture();
  await f.store.updateWord('folder-b', 'word-id', { word: 'word', meaning: 'meaning', customFields: [] });
  assert.equal(f.batches[0].length, 1);
  assert.equal(f.batches[0][0].ref.path, 'folder-b/word-id');
  assert.deepEqual(f.batches[0][0].data.customFields, []);
});

test('commit failure is surfaced and invalid custom input never commits', async () => {
  const f = fixture({ failCommit: true });
  await assert.rejects(f.store.createWord('folder-a', { word: 'word', meaning: 'meaning', customFields: [{ label: 'Gender', value: 'die' }] }), /commit failed/);
  assert.equal(f.batches.length, 0);
  await assert.rejects(f.store.updateWord('folder-a', 'word-id', { word: 'word', meaning: 'meaning', customFields: [{ label: '', value: 'value' }] }));
  assert.equal(f.batches.length, 0);
});
