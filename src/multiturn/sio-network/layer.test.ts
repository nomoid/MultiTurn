import { defaultSerializer, defaultDeserializer } from './layer';

test('testDeserializer', () => {
  expect(defaultDeserializer('a$b')).toEqual([true, 'a', 'b']);
});

test('testSerializer', () => {
  expect(defaultSerializer('a', 'b')).toEqual('a$b');
});
