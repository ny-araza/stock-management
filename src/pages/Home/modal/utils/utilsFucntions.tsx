export function formatDate(date: string): string {
  if (!date) {
    return "";
  }
  const temp = date.split("T");
  if (temp[1]) {
    const heure = temp[1].replace("Z", "");
    return `${temp[0]} à ${heure}`;
  }
  return temp[0] ?? "Format invalide";
}