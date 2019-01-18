const idsInUse: string[] = [];

export function generateRandomId(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(16);
}

export function generateUID(): string {
  let newId;
  do {
    newId = generateRandomId();
  }
  // Check that id is not already in use
  while (idsInUse.indexOf(newId) >= 0);
  idsInUse.push(newId);
  return newId;
}
