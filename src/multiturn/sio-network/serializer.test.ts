import { defaultSerializer, defaultDeserializer } from './serializer';

test('testDeserializer', () => {
  const deserializer = defaultDeserializer();

  // Test default
  expect(deserializer('a$b')).toEqual([true, 'a', 'b']);

  // Test no key
  expect(deserializer('$message')).toEqual([true, '', 'message']);

  // Test no value
  expect(deserializer('message')).toEqual([true, 'message', '']);

  // Test empty
  expect(deserializer('')).toEqual([true, '', '']);

  // Test $ unescaping
  expect(deserializer('a$$b')).toEqual([true, 'a$b', '']);
  expect(deserializer('a$$b$')).toEqual([true, 'a$b', '']);
  expect(deserializer('a$$b$c')).toEqual([true, 'a$b', 'c']);
  expect(deserializer('a$$b$c$d')).toEqual([true, 'a$b', 'c$d']);
  expect(deserializer('$a$b')).toEqual([true, '', 'a$b']);
  expect(deserializer('a$$$b')).toEqual([true, 'a$', 'b']);
  expect(deserializer('a$$$$b')).toEqual([true, 'a$$b', '']);
  expect(deserializer('a$$$$$b')).toEqual([true, 'a$$', 'b']);

});

test('testSerializer', () => {
  const serializer = defaultSerializer();

  // Test default
  expect(serializer('a', 'b')).toEqual('a$b');

  // Test no key
  expect(serializer('', 'message')).toEqual('$message');

  // Test no value
  expect(serializer('message', '')).toEqual('message$');

  // Test empty
  expect(serializer('', '')).toEqual('$');

  // Test $ escaping
  expect(serializer('a$b', '')).toEqual('a$$b$');
  expect(serializer('a$b', 'c')).toEqual('a$$b$c');
  expect(serializer('a$b', 'c$d')).toEqual('a$$b$c$d');
  expect(serializer('', 'a$b')).toEqual('$a$b');
  expect(serializer('a$', 'b')).toEqual('a$$$b');
  expect(serializer('a$$b', '')).toEqual('a$$$$b$');
  expect(serializer('a$$', 'b')).toEqual('a$$$$$b');
});
