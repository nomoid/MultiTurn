import { defaultSerializer, defaultDeserializer } from './serializer';

test('testDeserializer', () => {
  // Test default
  expect(defaultDeserializer('a$b')).toEqual([true, 'a', 'b']);

  // Test no key
  expect(defaultDeserializer('$message')).toEqual([true, '', 'message']);

  // Test no value
  expect(defaultDeserializer('message')).toEqual([true, 'message', '']);

  // Test empty
  expect(defaultDeserializer('')).toEqual([true, '', '']);

  // Test $ unescaping
  expect(defaultDeserializer('a$$b')).toEqual([true, 'a$b', '']);
  expect(defaultDeserializer('a$$b$')).toEqual([true, 'a$b', '']);
  expect(defaultDeserializer('a$$b$c')).toEqual([true, 'a$b', 'c']);
  expect(defaultDeserializer('a$$b$c$d')).toEqual([true, 'a$b', 'c$d']);
  expect(defaultDeserializer('$a$b')).toEqual([true, '', 'a$b']);
  expect(defaultDeserializer('a$$$b')).toEqual([true, 'a$', 'b']);
  expect(defaultDeserializer('a$$$$b')).toEqual([true, 'a$$b', '']);
  expect(defaultDeserializer('a$$$$$b')).toEqual([true, 'a$$', 'b']);

});

test('testSerializer', () => {
  // Test default
  expect(defaultSerializer('a', 'b')).toEqual('a$b');

  // Test no key
  expect(defaultSerializer('', 'message')).toEqual('$message');

  // Test no value
  expect(defaultSerializer('message', '')).toEqual('message$');

  // Test empty
  expect(defaultSerializer('', '')).toEqual('$');

  // Test $ escaping
  expect(defaultSerializer('a$b', '')).toEqual('a$$b$');
  expect(defaultSerializer('a$b', 'c')).toEqual('a$$b$c');
  expect(defaultSerializer('a$b', 'c$d')).toEqual('a$$b$c$d');
  expect(defaultSerializer('', 'a$b')).toEqual('$a$b');
  expect(defaultSerializer('a$', 'b')).toEqual('a$$$b');
  expect(defaultSerializer('a$$b', '')).toEqual('a$$$$b$');
  expect(defaultSerializer('a$$', 'b')).toEqual('a$$$$$b');
});
