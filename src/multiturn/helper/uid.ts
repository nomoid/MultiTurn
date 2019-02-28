const idsInUse: Set<string> = new Set();

export function generateRandomId(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(16);
}

export function generateUID(): string {
  let newId;
  do {
    newId = generateRandomId();
  }
  // Check that id is not already in use
  while (idsInUse.has(newId));
  idsInUse.add(newId);
  return newId;
}

export function compareNumber(a: number, b: number) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
