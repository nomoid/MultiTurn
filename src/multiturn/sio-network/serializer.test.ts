import { defaultSerializer, defaultDeserializer } from './serializer';

test('testDeserializer', () => {
  const t = '|';
  const deserializer = defaultDeserializer(t);

  // Test default
  expect(deserializer(`a${t}b`)).toEqual([true, 'a', 'b']);

  // Test no key
  expect(deserializer(`${t}message`)).toEqual([true, '', 'message']);

  // Test no value
  expect(deserializer('message')).toEqual([true, 'message', '']);

  // Test empty
  expect(deserializer('')).toEqual([true, '', '']);

  // Test $ unescaping
  expect(deserializer(`a${t}${t}b`)).toEqual([true, `a${t}b`, '']);
  expect(deserializer(`a${t}${t}b${t}`)).toEqual([true, `a${t}b`, '']);
  expect(deserializer(`a${t}${t}b${t}c`)).toEqual([true, `a${t}b`, 'c']);
  expect(deserializer(`a${t}${t}b${t}c${t}d`)).toEqual([true, `a${t}b`, `c${t}d`]);
  expect(deserializer(`${t}a${t}b`)).toEqual([true, '', `a${t}b`]);
  expect(deserializer(`a${t}b${t}c`)).toEqual([true, 'a', `b${t}c`]);
  expect(deserializer(`a${t}${t}${t}b`)).toEqual([true, `a${t}`, 'b']);
  expect(deserializer(`a${t}${t}${t}${t}b`)).toEqual([true, `a${t}${t}b`, '']);
  expect(deserializer(`a${t}${t}${t}${t}${t}b`)).toEqual([true, `a${t}${t}`, 'b']);

});

test('testSerializer', () => {
  const t = '|';
  const serializer = defaultSerializer(t);

  // Test default
  expect(serializer('a', 'b')).toEqual(`a${t}b`);

  // Test no key
  expect(serializer('', 'message')).toEqual(`${t}message`);

  // Test no value
  expect(serializer('message', '')).toEqual(`message${t}`);

  // Test empty
  expect(serializer('', '')).toEqual(`${t}`);

  // Test $ escaping
  expect(serializer(`a${t}b`, '')).toEqual(`a${t}${t}b${t}`);
  expect(serializer(`a${t}b`, 'c')).toEqual(`a${t}${t}b${t}c`);
  expect(serializer(`a${t}b`, `c${t}d`)).toEqual(`a${t}${t}b${t}c${t}d`);
  expect(serializer('', `a${t}b`)).toEqual(`${t}a${t}b`);
  expect(serializer(`a${t}`, 'b')).toEqual(`a${t}${t}${t}b`);
  expect(serializer(`a${t}${t}b`, '')).toEqual(`a${t}${t}${t}${t}b${t}`);
  expect(serializer(`a${t}${t}`, 'b')).toEqual(`a${t}${t}${t}${t}${t}b`);
});
