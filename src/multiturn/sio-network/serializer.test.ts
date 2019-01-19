import { randomData } from '../jest-helper';
import { defaultSerializer, defaultDeserializer } from './serializer';

test('testDeserializer', () => {
  const t = '$';
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
  const t = '$';
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

test('testRandomSerializeDeserialize', () => {
  const t = '$';
  const ser = defaultSerializer(t);
  const serializer = ([key, message]: [string, string]) => {
    return ser(key, message);
  };
  const deser = defaultDeserializer(t)
  const deserializer: (s: string) => [string, string] = (s: string) => {
    const [success, key, message] = deser(s);
    if (success) {
      return [key, message];
    }
    else {
      throw Error('Error deserializing');
    }
  };

  const len = 1000;
  const data = randomData(len);
  const data2 = randomData(len);
  const zipper: (s: string, i: number) => [string, string] = (x, i) => {
    return [x, data2[i]];
  }
  const pairs: Array<[string, string]> = data.map(zipper);

  for (const pair of pairs) {
    expect(deserializer(serializer(pair))).toEqual(pair);
    expect(deserializer(serializer(
      deserializer(serializer(pair))))).toEqual(pair);
  }
});
