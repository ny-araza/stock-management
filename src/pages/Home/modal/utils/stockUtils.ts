export interface LotStock {
  lot_code: string;
  lot_qte: number;
  lot_dateper: string; // ISO date string
}

export interface AllocationLot {
  lot_code: string;
  datePeremption: string;
  quantitePrise: number;
}

/**
 * Un lot est "sortable" seulement si sa date de péremption est
 * à au moins `joursMinimum` jours dans le futur (7j par défaut).
 * Un lot expiré ou trop proche de l'expiration n'est jamais sortable.
 */
export function estSortable(
  datePeremption: string,
  joursMinimum: number = 7,
): boolean {
  if (!datePeremption) return false;

  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  const dateLimite = new Date(datePeremption);
  dateLimite.setHours(0, 0, 0, 0);

  const diffJours = Math.floor(
    (dateLimite.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24),
  );

  return diffJours >= joursMinimum;
}

/**
 * Calcule le stock total réellement sortable pour un article,
 * en ne comptant que les lots respectant la règle des 7 jours.
 */
export function getStockSortable(
  lots: LotStock[],
  joursMinimum: number = 7,
): number {
  return lots
    .filter((lot) => estSortable(lot.lot_dateper, joursMinimum))
    .reduce((total, lot) => total + Number(lot.lot_qte || 0), 0);
}

/**
 * Alloue une quantité demandée à travers les lots disponibles
 * selon la méthode FEFO (First Expired, First Out) :
 * on consomme d'abord les lots qui expirent le plus tôt,
 * parmi ceux qui sont sortables.
 *
 * Lance une erreur si la quantité demandée dépasse le stock sortable.
 */
export function allouerLotsFEFO(
  lots: LotStock[],
  quantiteDemandee: number,
  joursMinimum: number = 7,
): AllocationLot[] {
  const lotsSortables = lots
    .filter((lot) => estSortable(lot.lot_dateper, joursMinimum))
    .sort(
      (a, b) =>
        new Date(a.lot_dateper).getTime() - new Date(b.lot_dateper).getTime(),
    );

  const stockTotal = lotsSortables.reduce(
    (t, l) => t + Number(l.lot_qte || 0),
    0,
  );

  if (quantiteDemandee > stockTotal) {
    throw new Error(
      `Stock sortable insuffisant. Disponible : ${stockTotal}, demandé : ${quantiteDemandee}`,
    );
  }

  const allocations: AllocationLot[] = [];
  let reste = quantiteDemandee;

  for (const lot of lotsSortables) {
    if (reste <= 0) break;
    const qteDuLot = Math.min(Number(lot.lot_qte), reste);
    if (qteDuLot > 0) {
      allocations.push({
        lot_code: lot.lot_code,
        datePeremption: lot.lot_dateper,
        quantitePrise: qteDuLot,
      });
      reste -= qteDuLot;
    }
  }

  return allocations;
}
