export function euro(valore: number, decimali = 0): string {
  return valore.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimali,
    maximumFractionDigits: decimali,
  });
}

export function euroCompatto(valore: number): string {
  if (Math.abs(valore) >= 1000) {
    return `${(valore / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}k €`;
  }
  return euro(valore);
}

export function percento(valore: number, decimali = 0): string {
  return `${valore.toLocaleString("it-IT", { minimumFractionDigits: decimali, maximumFractionDigits: decimali })}%`;
}

export function numero(valore: number, decimali = 0): string {
  return valore.toLocaleString("it-IT", { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
}
