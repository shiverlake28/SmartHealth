export type Center = { id: string; name: string; type: 'PHC' | 'CHC'; district: string; status: 'active' | 'inactive'; };

export type Medicine = { id: string; name: string; unit: string; criticalMin: number; reorderPoint: number; leadTimeDays: number; };

export type StockItem = { centerId: string; medicineId: string; qtyOnHand: number; qtyIssuedToday: number; qtyReceivedToday: number; avgDailyConsumption14d: number; expiryDates: string[]; };

export type FootfallPoint = { centerId: string; date: string; hour: number; count: number; };

export type Beds = { centerId: string; total: number; occupied: number; available: number; icuTotal: number; icuOccupied: number; };

export type Doctors = { centerId: string; date: string; shift: string; present: string[]; absent: string[]; total: number; };

export type TestItem = { centerId: string; testType: string; available: boolean; capacityPerDay: number; doneToday: number; pending: number; };

export type Alert = { id: string; centerId: string; type: string; severity: 'low'|'med'|'high'|'critical'; createdAt: string; status: 'open'|'ack'; message: string; };

export type Severity = Alert['severity'];
export type CenterType = Center['type'];
