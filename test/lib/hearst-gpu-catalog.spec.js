/**
 * Tests unitaires — lib/hearst-gpu-catalog.js
 *
 * AC-C1 : Pour un SKU rack_scale (NVL72), capex et revenue reposent sur le MÊME
 *         nombre de GPU (density_per_rack des deux côtés). Échoue si un facteur 72
 *         réapparaît d'un seul côté.
 * AC-C2 : gpu_hour_price est en $/GPU-h — cohérent avec total_gpus = racks × density.
 */

import { describe, it, expect } from 'vitest';
import {
  GPU_BY_ID,
  REFERENCE_GPU_HOUR_PRICES,
  calcGpuCapex,
  calcGpuAnnualRevenue,
  calcRackPower,
  calcNumRacksForMw,
  calcHardwareBreakdown,
  mergeCatalog,
  GPU_CATALOG,
} from '../../lib/hearst-gpu-catalog.js';

// ─── Helpers ────────────────────────────────────────────────────────────────
const NVL72 = GPU_BY_ID['gb200_nvl72'];
const H100  = GPU_BY_ID['h100_sxm5'];

// ─── AC-C1 : invariant de base GPU (rack_scale NVL72) ────────────────────────
describe('AC-C1 — NVL72 capex/revenue partagent le même dénominateur GPU', () => {
  it('total_gpus (revenue) = num_racks × density_per_rack pour NVL72 (1 rack)', () => {
    const NUM_RACKS = 1;
    const UTIL = 75;
    const GPU_H_PRICE = REFERENCE_GPU_HOUR_PRICES['gb200_nvl72'];

    // Capex : msrp_usd par RACK (rack_scale branch) — facteur GPU implicite = density
    const capex = calcGpuCapex(NUM_RACKS, NVL72);
    // Revenue : total_gpus = num_racks × density_per_rack = 1 × 72
    const revenue = calcGpuAnnualRevenue(NUM_RACKS, NVL72, UTIL, GPU_H_PRICE);

    // Capex implicite par GPU = capex / density_per_rack (pas de facteur 72 supplémentaire)
    const capex_per_gpu = capex / NVL72.density_per_rack;
    // Revenue par GPU = revenue / density_per_rack
    const revenue_per_gpu = revenue / NVL72.density_per_rack;

    // Les deux métriques "par GPU" doivent être cohérentes avec density_per_rack = 72
    expect(NVL72.density_per_rack).toBe(72);
    expect(capex_per_gpu).toBeCloseTo(NVL72.msrp_usd * 1.15 / 72, 0); // $47 917 / GPU
    expect(revenue_per_gpu).toBeCloseTo((UTIL / 100) * 8760 * GPU_H_PRICE, 2);

    // Guard : si un facteur 72 réapparaissait dans calcGpuCapex (rack_scale bypasse
    // density_per_rack), le capex serait 72× trop grand.
    const expected_capex = NUM_RACKS * NVL72.msrp_usd * 1.15;
    expect(capex).toBeCloseTo(expected_capex, 0);
    expect(capex).not.toBeCloseTo(expected_capex * 72, -3); // sanity : pas 72× trop grand
  });

  it('total_gpus (revenue) = num_racks × density_per_rack pour NVL72 (10 racks)', () => {
    const NUM_RACKS = 10;
    const UTIL = 80;
    const GPU_H_PRICE = 5.00;

    const expected_total_gpus = NUM_RACKS * NVL72.density_per_rack; // 720
    const revenue = calcGpuAnnualRevenue(NUM_RACKS, NVL72, UTIL, GPU_H_PRICE);
    const expected_revenue = expected_total_gpus * (UTIL / 100) * 8760 * GPU_H_PRICE;

    expect(revenue).toBeCloseTo(expected_revenue, 0);
    // Guard : si density_per_rack était appliqué deux fois (×72 dans capex ET dans revenue),
    // le résultat serait 72× trop grand.
    expect(revenue).not.toBeCloseTo(expected_revenue * 72, -6);
  });

  it('capex NVL72 ne contient PAS de facteur density_per_rack supplémentaire (rack_scale branch)', () => {
    // calcGpuCapex, branche rack_scale : num_racks * msrp_usd * 1.15
    // La branche non-rack_scale aurait fait : num_racks * density_per_rack * msrp_usd * 1.15
    // On vérifie que le rack_scale bypass le density_per_rack dans capex.
    const capex_rack_scale = calcGpuCapex(1, NVL72);
    // Si la branche non-rack_scale avait été prise : 1 × 72 × 3_000_000 × 1.15
    const wrong_capex = 1 * NVL72.density_per_rack * NVL72.msrp_usd * 1.15;
    expect(capex_rack_scale).not.toBeCloseTo(wrong_capex, -3);
    expect(capex_rack_scale).toBeCloseTo(1 * NVL72.msrp_usd * 1.15, 0);
  });

  it('payback 1 rack NVL72 @ 75% util $5/GPU-h ≈ 1.46 ans (sanity check financier)', () => {
    const capex   = calcGpuCapex(1, NVL72);                              // $3 450 000
    const revenue = calcGpuAnnualRevenue(1, NVL72, 75, 5.00);            // $2 365 200
    const payback = capex / revenue;
    expect(capex).toBeCloseTo(3_450_000, -2);
    expect(revenue).toBeCloseTo(2_365_200, -2);
    expect(payback).toBeGreaterThan(1.4);
    expect(payback).toBeLessThan(1.6);
  });
});

// ─── AC-C2 : gpu_hour_price toujours en $/GPU-heure ──────────────────────────
describe('AC-C2 — gpu_hour_price en $/GPU-h pour tous les SKUs', () => {
  it('REFERENCE_GPU_HOUR_PRICES contient gb200_nvl72 (prix par GPU-h)', () => {
    expect(REFERENCE_GPU_HOUR_PRICES['gb200_nvl72']).toBeDefined();
    expect(typeof REFERENCE_GPU_HOUR_PRICES['gb200_nvl72']).toBe('number');
    expect(REFERENCE_GPU_HOUR_PRICES['gb200_nvl72']).toBeGreaterThan(0);
  });

  it('revenue NVL72 scale linéairement avec gpu_hour_price ($/GPU-h)', () => {
    const r1 = calcGpuAnnualRevenue(1, NVL72, 100, 1.0);
    const r2 = calcGpuAnnualRevenue(1, NVL72, 100, 2.0);
    expect(r2).toBeCloseTo(r1 * 2, 0);
  });

  it('revenue NVL72 scale linéairement avec density_per_rack (même dénominateur que capex)', () => {
    // Si on doublait density_per_rack, revenue doublerait aussi → linéarité prouvée
    const r_base = calcGpuAnnualRevenue(1, NVL72, 100, 5.0);
    const r_expected = NVL72.density_per_rack * (100 / 100) * 8760 * 5.0;
    expect(r_base).toBeCloseTo(r_expected, 0);
  });
});

// ─── Tests supplémentaires — comportement général ────────────────────────────
describe('calcGpuCapex', () => {
  it('retourne 0 pour num_racks <= 0', () => {
    expect(calcGpuCapex(0, H100)).toBe(0);
    expect(calcGpuCapex(-1, H100)).toBe(0);
  });

  it('H100 non-rack_scale inclut density_per_rack dans capex', () => {
    const capex = calcGpuCapex(1, H100);
    expect(capex).toBeCloseTo(1 * H100.density_per_rack * H100.msrp_usd * 1.15, 0);
  });

  it('NVL72 rack_scale n\'inclut PAS density_per_rack dans capex', () => {
    const capex = calcGpuCapex(1, NVL72);
    expect(capex).toBeCloseTo(1 * NVL72.msrp_usd * 1.15, 0);
  });
});

describe('calcGpuAnnualRevenue', () => {
  it('retourne 0 si utilization = 0', () => {
    expect(calcGpuAnnualRevenue(1, NVL72, 0, 5.0)).toBe(0);
  });

  it('retourne 0 si gpu_hour_price = 0', () => {
    expect(calcGpuAnnualRevenue(1, NVL72, 75, 0)).toBe(0);
  });

  it('H100 1 rack 100% util $2.49 = 8 × 8760 × 2.49', () => {
    const revenue = calcGpuAnnualRevenue(1, H100, 100, 2.49);
    expect(revenue).toBeCloseTo(8 * 8760 * 2.49, 0);
  });
});

describe('calcRackPower', () => {
  it('NVL72 = 132 kW (tdp_w / 1000)', () => {
    expect(calcRackPower(NVL72)).toBeCloseTo(132, 1);
  });

  it('H100 inclut 15% host overhead', () => {
    const expected = (8 * 700 * 1.15) / 1000;
    expect(calcRackPower(H100)).toBeCloseTo(expected, 3);
  });

  it('retourne 0 pour gpu null', () => {
    expect(calcRackPower(null)).toBe(0);
  });
});

describe('calcNumRacksForMw', () => {
  it('NVL72 : 1 MW → floor(1000/132) = 7 racks', () => {
    expect(calcNumRacksForMw(1, NVL72)).toBe(7);
  });

  it('retourne 0 pour gpu null', () => {
    expect(calcNumRacksForMw(10, null)).toBe(0);
  });
});

describe('calcHardwareBreakdown', () => {
  it('retourne null sans hardware_mix', () => {
    expect(calcHardwareBreakdown({ total_mw: 100 }, null)).toBeNull();
  });

  it('NVL72 — capex et revenue cohérents avec calcGpuCapex/calcGpuAnnualRevenue', () => {
    const mix = {
      ai_pct: 100,
      gpu_sku_id: 'gb200_nvl72',
      num_racks: 5,
      utilization_pct: 75,
      gpu_hour_price: 5.0,
    };
    const result = calcHardwareBreakdown({ total_mw: 660 }, mix);
    expect(result).not.toBeNull();
    expect(result.capex_hardware).toBeCloseTo(calcGpuCapex(5, NVL72), 0);
    expect(result.revenue_ai_annual).toBeCloseTo(calcGpuAnnualRevenue(5, NVL72, 75, 5.0), 0);
    expect(result.total_gpus).toBe(5 * 72);
  });
});

describe('mergeCatalog', () => {
  it('retourne le catalogue local si remote est vide', () => {
    expect(mergeCatalog(GPU_CATALOG, [])).toEqual(GPU_CATALOG);
  });

  it('remote a priorité sur local pour un même SKU', () => {
    const remote = [{ sku: 'H100 SXM5', id: 'uuid-123', msrp_usd: 99_000 }];
    const merged = mergeCatalog(GPU_CATALOG, remote);
    const h100 = merged.find(g => g.sku === 'H100 SXM5');
    expect(h100.msrp_usd).toBe(99_000);
  });
});
