const STORAGE_KEY = "calcolatore_device_id";

function generaUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback per ambienti senza crypto.randomUUID (raro, ma non impossibile su mobile datato)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** UUID stabile per il dispositivo, generato una volta e persistito in localStorage. */
export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generaUuid();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function setDeviceId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}
