import assert from 'node:assert/strict';
import test from 'node:test';
import { getWordDetails, normalizeCustomFields, normalizeWordValues, readWordDetails, uniqueFieldNames } from '../src/lib/wordFields.ts';

test('loads Japanese reading and part of speech with existing labels', () => {
  const details = readWordDetails({ part: '동사', yomigana: 'fallback', fields: { reading: 'あやまる', readingType: '훈독' } });
  assert.equal(details.reading, 'あやまる');
  assert.equal(details.partOfSpeech, '동사');
  assert.deepEqual(details.customFields, [{ label: '읽기 유형', value: '훈독' }]);
  assert.equal(readWordDetails({ yomigana: 'のうしゅく' }).reading, 'のうしゅく');
});

test('combines German forms without losing gender and usage', () => {
  const details = readWordDetails({ part: '동사', fields: { Präteritum: 'begegnete', partizip2: 'begegnet', auxiliary: 'ist', usage: '+D', gender: 'die' } });
  assert.equal(details.inflections, '과거형: begegnete\n과거분사: begegnet\n조동사: ist');
  assert.deepEqual(details.customFields, [{ label: '용법', value: '+D' }, { label: '성 / 관사', value: 'die' }]);
});

test('saving new fields overrides aliases and preserves other old details', () => {
  const legacy = { part: '명사', yomigana: 'old', fields: { reading: 'old', plural: 'old plural', gender: 'die' } };
  const values = normalizeWordValues({ word: ' Wort ', meaning: ' 단어 ', reading: ' new ', partOfSpeech: '명사', inflections: 'new plural', example: 'ein Wort' });
  const loaded = readWordDetails({ ...legacy, ...values });
  assert.equal(loaded.reading, 'new');
  assert.equal(loaded.inflections, 'new plural');
  assert.equal(loaded.example, 'ein Wort');
  assert.deepEqual(loaded.customFields, [{ label: '성 / 관사', value: 'die' }]);
  assert.equal(values.word, 'Wort');
});

test('clearing optional fields does not resurrect legacy values on reload', () => {
  const loaded = readWordDetails({ part: '동사', yomigana: 'old', fields: { reading: 'old', plural: 'old', example: 'old' }, ...normalizeWordValues({ word: 'word', meaning: '뜻' }) });
  assert.equal(loaded.reading, undefined);
  assert.equal(loaded.partOfSpeech, undefined);
  assert.equal(loaded.inflections, undefined);
  assert.equal(loaded.example, undefined);
  assert.deepEqual(getWordDetails(loaded), []);
});

test('card details include all common fields and unknown legacy information', () => {
  const values = readWordDetails({ reading: 'read', partOfSpeech: '명사', inflections: 'forms', example: 'example', fields: { custom: ['one', 'two'] } });
  assert.deepEqual(getWordDetails(values).map(({ label }) => label), ['읽는 방법', '품사', '변화형', '예문', 'custom']);
  assert.equal(values.customFields[0].value, 'one, two');
});

test('rejects blank required fields and tolerates malformed old optional fields', () => {
  assert.throws(() => normalizeWordValues({ word: ' ', meaning: '뜻' }));
  assert.throws(() => normalizeWordValues({ word: 'word', meaning: ' ' }));
  assert.deepEqual(getWordDetails(readWordDetails({ fields: null, reading: 123 })), []);
});

test('custom fields override old language fields including renamed or removed fields', () => {
  const old = { fields: { gender: 'die', readingType: '훈독' } };
  const values = normalizeWordValues({ word: 'word', meaning: '뜻', customFields: [{ label: ' 관사 ', value: ' der ' }] });
  const loaded = readWordDetails({ ...old, ...values });
  assert.deepEqual(loaded.customFields, [{ label: '관사', value: 'der' }]);
  assert.deepEqual(readWordDetails({ ...old, customFields: [] }).customFields, []);
});

test('custom field validation rejects blank, duplicate and common field names', () => {
  assert.throws(() => normalizeCustomFields([{ label: ' ', value: 'a' }]));
  assert.throws(() => normalizeCustomFields([{ label: ' Gender ', value: 'a' }, { label: 'gender', value: 'b' }]));
  assert.throws(() => normalizeCustomFields([{ label: '읽는 방법', value: 'a' }]));
  assert.throws(() => normalizeCustomFields([{ label: '단어', value: 'a' }]));
  assert.throws(() => normalizeCustomFields([{ label: '뜻', value: 'a' }]));
});

test('folder names deduplicate while preserving readable labels and ignoring invalid data', () => {
  assert.deepEqual(uniqueFieldNames([' Gender ', 'gender', '', null, 23, '읽기   유형', '읽기 유형']), ['Gender', '읽기 유형']);
  assert.deepEqual(uniqueFieldNames(null), []);
});

test('empty custom values remain reusable without showing empty rows on cards', () => {
  const saved = normalizeWordValues({ word: 'a', meaning: 'b', customFields: [{ label: '성', value: ' ' }] });
  assert.deepEqual(saved.customFields, [{ label: '성', value: '' }]);
  assert.deepEqual(getWordDetails(readWordDetails(saved)), []);
});
