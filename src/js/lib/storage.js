const memory = new Map();

function canUseStorage() {
  try {
    const key = "__pop_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const persistent = canUseStorage();

export function read(key, fallback) {
  if (persistent) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  return memory.has(key) ? memory.get(key) : fallback;
}

export function write(key, value) {
  if (persistent) {
    window.localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  memory.set(key, value);
}

export function remove(key) {
  if (persistent) {
    window.localStorage.removeItem(key);
    return;
  }
  memory.delete(key);
}
