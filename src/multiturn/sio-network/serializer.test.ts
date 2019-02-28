import { randomData } from '../helper/jest-helper';
import { defaultSerializer, defaultDeserializer } from './serializer';

test('testDeserializer', () => {
  const t = '*';
  const s = '|';
  const deserializer = defaultDeserializer(t, s);

  const fail = [false, '', ''];

  // Test default
  expect(deserializer(`a${t}${s}b`)).toEqual([true, 'a', 'b']);

  // Test no key
  expect(deserializer(`${t}${s}message`)).toEqual([true, '', 'message']);

  // Test no value
  expect(deserializer(`message${t}${s}`)).toEqual([true, 'message', '']);

  // Test empty
  expect(deserializer('')).toEqual(fail);

  // Test $ unescaping
  expect(deserializer(`${t}`)).toEqual(fail);
  expect(deserializer(`${t}${s}`)).toEqual([true, '', '']);
  expect(deserializer(`a${t}${t}b`)).toEqual(fail);
  expect(deserializer(`a${t}${t}b${t}`)).toEqual(fail);
  expect(deserializer(`a${t}${t}${s}b${t}`)).toEqual(fail);
  expect(deserializer(`a${t}${t}b${t}${s}`)).toEqual([true, `a${t}b`, '']);
  expect(deserializer(`a${t}${t}b${t}${s}c`)).toEqual([true, `a${t}b`, 'c']);
  expect(deserializer(`a${t}${t}b${t}${s}c${t}d`)).toEqual([true, `a${t}b`, `c${t}d`]);
  expect(deserializer(`${t}a${t}b`)).toEqual(fail);
  expect(deserializer(`${t}${s}a${t}b`)).toEqual([true, '', `a${t}b`]);
  expect(deserializer(`a${t}${s}b${t}${s}c`)).toEqual([true, 'a', `b${t}${s}c`]);
  expect(deserializer(`a${t}${t}${t}b${t}${s}`)).toEqual(fail);
  expect(deserializer(`a${t}${t}${t}${t}b${t}${s}`)).toEqual([true, `a${t}${t}b`, '']);
  expect(deserializer(`a${t}${t}${t}${t}${t}b${t}${s}`)).toEqual(fail);

});

test('testSerializer', () => {
  const t = '*';
  const s = '|';
  const serializer = defaultSerializer(t, s);

  // Test default
  expect(serializer('a', 'b')).toEqual(`a${t}${s}b`);

  // Test no key
  expect(serializer('', 'message')).toEqual(`${t}${s}message`);

  // Test no value
  expect(serializer('message', '')).toEqual(`message${t}${s}`);

  // Test empty
  expect(serializer('', '')).toEqual(`${t}${s}`);

  // Test $ escaping
  expect(serializer(`a${t}b`, '')).toEqual(`a${t}${t}b${t}${s}`);
  expect(serializer(`a${t}b`, 'c')).toEqual(`a${t}${t}b${t}${s}c`);
  expect(serializer(`a${t}b`, `c${t}d`)).toEqual(`a${t}${t}b${t}${s}c${t}d`);
  expect(serializer('', `a${t}b`)).toEqual(`${t}${s}a${t}b`);
  expect(serializer(`a${t}`, 'b')).toEqual(`a${t}${t}${t}${s}b`);
  expect(serializer(`a${t}${t}b`, '')).toEqual(`a${t}${t}${t}${t}b${t}${s}`);
  expect(serializer(`a${t}${t}`, 'b')).toEqual(`a${t}${t}${t}${t}${t}${s}b`);
});

test('testRandomSerializeDeserialize', () => {
  const t = '*';
  const m = '|';
  const ser = defaultSerializer(t, m);
  const serializer = ([key, message]: [string, string]) => {
    return ser(key, message);
  };
  const deser = defaultDeserializer(t, m);
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
  };
  const pairs: Array<[string, string]> = data.map(zipper);

  for (const pair of pairs) {
    expect(deserializer(serializer(pair))).toEqual(pair);
    expect(deserializer(serializer(
      deserializer(serializer(pair))))).toEqual(pair);
  }
});
