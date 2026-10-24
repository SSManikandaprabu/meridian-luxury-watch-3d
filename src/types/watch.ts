export type DialColorId = 'glacier' | 'midnight' | 'verdigris' | 'ivory';
export type StrapTypeId = 'leather' | 'steel' | 'nylon';
export type CalloutPartId = 'crown' | 'crystal' | 'date' | 'lugs' | null;

export interface DialSpec {
  id: DialColorId;
  name: string;
  subtitle: string;
  hex: string;
  secondaryHex: string;
  sheenHex: string;
  isLightDial: boolean;
  referenceCode: string;
}

export interface StrapSpec {
  id: StrapTypeId;
  name: string;
  material: string;
  clasp: string;
  priceDelta: number;
  swatchHex: string;
}

export interface PartCalloutInfo {
  id: Exclude<CalloutPartId, null>;
  label: string;
  title: string;
  spec: string;
  position: [number, number, number];
}

export interface CollectionReference {
  id: string;
  refNumber: string;
  name: string;
  subtitle: string;
  dial: DialColorId;
  strap: StrapTypeId;
  caseMaterial: string;
  basePrice: number;
  waterResistance: string;
  powerReserve: string;
  frequency: string;
  description: string;
}

export const BASE_WATCH_PRICE = 14800;

export const DIAL_SPECS: Record<DialColorId, DialSpec> = {
  glacier: {
    id: 'glacier',
    name: 'Glacier Blue',
    subtitle: 'Radial Sunburst Rhodium-Ice',
    hex: '#5D7D99',
    secondaryHex: '#8FAEC7',
    sheenHex: '#C8E0F4',
    isLightDial: false,
    referenceCode: 'REF. 4010/1A-GL',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Ink',
    subtitle: 'Abyssal Galvanic Navy PVD',
    hex: '#0D1C2E',
    secondaryHex: '#1A314C',
    sheenHex: '#507296',
    isLightDial: false,
    referenceCode: 'REF. 4012/1A-MN',
  },
  verdigris: {
    id: 'verdigris',
    name: 'Verdigris Patina',
    subtitle: 'Alpine Malachite Sunburst',
    hex: '#163D37',
    secondaryHex: '#255D54',
    sheenHex: '#63A89A',
    isLightDial: false,
    referenceCode: 'REF. 4018/1A-VG',
  },
  ivory: {
    id: 'ivory',
    name: 'Grand Feu Ivory',
    subtitle: 'Warm Silvered Champagne Grained',
    hex: '#DFD7C4',
    secondaryHex: '#F2EEE6',
    sheenHex: '#FFFDF8',
    isLightDial: true,
    referenceCode: 'REF. 4014/1A-IV',
  },
};

export const STRAP_SPECS: Record<StrapTypeId, StrapSpec> = {
  leather: {
    id: 'leather',
    name: 'Saddle-Stitched Barénia Leather',
    material: 'Full-grain French calfskin with ecru linen thread',
    clasp: '316L Brushed Pin Tang Buckle',
    priceDelta: 0,
    swatchHex: '#3B261A',
  },
  steel: {
    id: 'steel',
    name: 'Integrated 316L Architecture Bracelet',
    material: 'Three-row satin-brushed links with mirror-chamfered center',
    clasp: 'Twin-Trigger Micro-Adjust Deployant',
    priceDelta: 950,
    swatchHex: '#9BAAB8',
  },
  nylon: {
    id: 'nylon',
    name: 'Hydro-Weave Technical Sailcloth',
    material: 'High-tenacity navy ballistic twill with leather lining',
    clasp: 'Twin Brushed Steel Keeper Loops',
    priceDelta: -250,
    swatchHex: '#1A2B3D',
  },
};

export const PART_CALLOUTS: Record<Exclude<CalloutPartId, null>, PartCalloutInfo> = {
  crown: {
    id: 'crown',
    label: '01 · CROWN',
    title: 'Twin-Lock Knurled Crown',
    spec: '36 fluted grip ridges · 10 ATM hermetic triple-gasket seal',
    position: [2.26, 0.0, 0.0],
  },
  crystal: {
    id: 'crystal',
    label: '02 · CRYSTAL',
    title: 'Box-Domed Corundum Sapphire',
    spec: 'IOR 1.77 · 9 Mohs hardness · Double-sided blue AR vapor coating',
    position: [-0.85, 0.95, 0.42],
  },
  date: {
    id: 'date',
    label: '03 · DATE COMPLICATION',
    title: 'Instantaneous Jumping Aperture',
    spec: 'Diamond-beveled frame at 3H · Midnight 4ms cam release',
    position: [1.28, -0.05, 0.25],
  },
  lugs: {
    id: 'lugs',
    label: '04 · CASE LUGS',
    title: 'Hand-Anglage 316L Lugs',
    spec: 'Vertical satin-brushed upper plane · 45° mirror-polished chamfer',
    position: [-1.42, 1.98, 0.12],
  },
};

export const COLLECTION_REFERENCES: CollectionReference[] = [
  {
    id: 'meridian-glacier',
    refNumber: 'REF. 4010/1A',
    name: 'Meridian Chronomètre Glacier',
    subtitle: '40mm · 316L Steel · Integrated Bracelet',
    dial: 'glacier',
    strap: 'steel',
    caseMaterial: '316L Cold-Forged Surgical Steel',
    basePrice: 15750,
    waterResistance: '100m / 10 ATM',
    powerReserve: '72 Hours (Twin Barrel)',
    frequency: '28,800 vph (4 Hz)',
    description:
      'Inspired by high-altitude glacial crevasses above Lake Geneva. The metallic ice-blue sunburst dial shifts from cool slate to brilliant silver under grazing light.',
  },
  {
    id: 'meridian-midnight',
    refNumber: 'REF. 4012/1A',
    name: 'Meridian Nocturne Midnight',
    subtitle: '40mm · 316L Steel · Saddle-Stitched Leather',
    dial: 'midnight',
    strap: 'leather',
    caseMaterial: '316L Cold-Forged Surgical Steel',
    basePrice: 14800,
    waterResistance: '100m / 10 ATM',
    powerReserve: '72 Hours (Twin Barrel)',
    frequency: '28,800 vph (4 Hz)',
    description:
      'Deep galvanic ink-navy dial paired with Grade X1 Super-LumiNova BGW9 indices and our signature oxidized copper sweep seconds hand.',
  },
  {
    id: 'meridian-verdigris',
    refNumber: 'REF. 4018/1A',
    name: 'Meridian Atelier Verdigris',
    subtitle: '40mm · 316L Steel · Technical Sailcloth',
    dial: 'verdigris',
    strap: 'nylon',
    caseMaterial: '316L Cold-Forged Surgical Steel',
    basePrice: 14550,
    waterResistance: '100m / 10 ATM',
    powerReserve: '72 Hours (Twin Barrel)',
    frequency: '28,800 vph (4 Hz)',
    description:
      'Architectural bronze-emerald dial echoing aged copper observatory domes, fitted with a hydro-weave maritime sailcloth strap.',
  },
];
