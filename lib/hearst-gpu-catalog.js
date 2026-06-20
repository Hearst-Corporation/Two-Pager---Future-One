// HEARST GPU Catalog — source of truth pour les SKU GPU disponibles.
//
// Utilisé comme fallback in-memory si crm.hearst_gpu_catalog (Supabase) n'est
// pas encore seedé. La table DB et ce module exposent le même schéma — un
// helper `mergeCatalog(local, remote)` est fourni pour la composition.
//
// Densités et prix calibrés depuis :
//   - NVIDIA H100 / H200 / GB200 NVL72 official product pages
//   - AMD Instinct MI300X press release (2023-12-06)
//   - Lambda AI Cloud pricing (gpu_hour reference points)
//   - SemiAnalysis cost breakdowns (markup, host overhead)

/**
 * @typedef {Object} GpuCatalogRow
 * @property {string} id                  Slug interne, ex: 'h100_sxm5'
 * @property {string} sku                 Nom commercial, ex: 'H100 SXM5'
 * @property {'NVIDIA'|'AMD'|'Intel'|'Other'} vendor
 * @property {number} tdp_w               TDP en watts (par GPU sauf GB200 NVL72 = par rack)
 * @property {number} msrp_usd            Prix de référence USD (unité ou rack pour NVL72)
 * @property {number} density_per_rack    Nombre de GPUs par rack standard
 * @property {number} [perf_tflops_fp16]
 * @property {number} [perf_tflops_fp8]
 * @property {number} [hbm_gb]            Mémoire HBM par GPU
 * @property {string} [available_from]    ISO date
 * @property {'training'|'inference'|'mixed'} [use_case]
 * @property {string} [reference_url]
 * @property {string} [notes]
 * @property {boolean} [rack_scale]       True si msrp_usd et tdp_w sont par rack (GB200 NVL72)
 */

/** @type {GpuCatalogRow[]} */
export const GPU_CATALOG = [
  {
    id: 'h100_sxm5',
    sku: 'Standard accelerator profile',
    vendor: 'NVIDIA',
    tdp_w: 700,
    msrp_usd: 30_000,
    density_per_rack: 8,
    perf_tflops_fp16: 1979,
    perf_tflops_fp8: 3958,
    hbm_gb: 80,
    available_from: '2023-03-01',
    use_case: 'training',
    reference_url: 'https://www.nvidia.com/en-us/data-center/h100/',
    notes: 'H100 SXM5 · Hopper · ~6 kW/rack (8 units + host).',
    rack_scale: false,
  },
  {
    id: 'h200_sxm5',
    sku: 'Advanced accelerator profile',
    vendor: 'NVIDIA',
    tdp_w: 700,
    msrp_usd: 32_000,
    density_per_rack: 8,
    perf_tflops_fp16: 1979,
    perf_tflops_fp8: 3958,
    hbm_gb: 141,
    available_from: '2024-04-01',
    use_case: 'inference',
    reference_url: 'https://www.nvidia.com/en-us/data-center/h200/',
    notes: 'H200 SXM5 · Hopper refresh · 141 GB HBM for long-context workloads.',
    rack_scale: false,
  },
  {
    id: 'gb200_nvl72',
    sku: 'High-density accelerator profile',
    vendor: 'NVIDIA',
    tdp_w: 132_000, // par RACK — NVIDIA GB200 NVL72 spec sheet
    msrp_usd: 3_000_000, // par RACK
    density_per_rack: 72,
    perf_tflops_fp16: 5000,
    perf_tflops_fp8: 10_000,
    hbm_gb: 192,
    available_from: '2025-01-01',
    use_case: 'training',
    reference_url: 'https://www.nvidia.com/en-us/data-center/gb200-nvl72/',
    notes: 'GB200 NVL72 · Blackwell rack-scale · 132 kW/rack · requires liquid cooling.',
    rack_scale: true,
  },
  {
    id: 'mi300x',
    sku: 'Alternative accelerator profile',
    vendor: 'AMD',
    tdp_w: 750,
    msrp_usd: 15_000,
    density_per_rack: 8,
    perf_tflops_fp16: 1307,
    perf_tflops_fp8: 2614,
    hbm_gb: 192,
    available_from: '2023-12-06',
    use_case: 'inference',
    reference_url: 'https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html',
    notes: 'MI300X · AMD Instinct · 192 GB HBM3 · cost-optimised inference.',
    rack_scale: false,
  },
];

/** Map id → row pour lookup O(1). */
const GPU_BY_ID = Object.fromEntries(GPU_CATALOG.map(g => [g.id, g]));

/**
 * Puissance par rack en kW.
 * Pour GB200 NVL72 c'est natif (1.2 MW). Pour les autres : density × tdp_w + 15% host overhead.
 *
 * @param {GpuCatalogRow} gpu
 * @returns {number} kW par rack
 */
function calcRackPower(gpu) {
  if (!gpu) return 0;
  if (gpu.rack_scale) return gpu.tdp_w / 1000;
  const HOST_OVERHEAD = 1.15;
  return (gpu.density_per_rack * gpu.tdp_w * HOST_OVERHEAD) / 1000;
}

/**
 * CAPEX hardware pour `num_racks` racks d'un SKU donné.
 * Inclut un markup 15% (intégration, switching, host CPUs hors GB200).
 *
 * @param {number} num_racks
 * @param {GpuCatalogRow} gpu
 * @returns {number} USD
 */
function calcGpuCapex(num_racks, gpu) {
  if (!gpu || !num_racks || num_racks <= 0) return 0;
  const HARDWARE_MARKUP = 1.15;
  if (gpu.rack_scale) {
    return num_racks * gpu.msrp_usd * HARDWARE_MARKUP;
  }
  return num_racks * gpu.density_per_rack * gpu.msrp_usd * HARDWARE_MARKUP;
}

/**
 * Revenu annuel GPU-cloud.
 *
 *   total_gpus = num_racks × density_per_rack
 *   revenue   = total_gpus × utilization × 8760 × $/gpu-hour
 *
 * Pour GB200 NVL72 on multiplie par 72 GPUs/rack (le prix de référence est aussi
 * par GPU dans ce mode — l'utilisateur peut surcharger).
 *
 * @param {number} num_racks
 * @param {GpuCatalogRow} gpu
 * @param {number} utilization_pct   0-100
 * @param {number} gpu_hour_price    USD par GPU-heure
 * @returns {number} USD/an
 */
function calcGpuAnnualRevenue(num_racks, gpu, utilization_pct, gpu_hour_price) {
  if (!gpu || !num_racks || num_racks <= 0) return 0;
  if (!utilization_pct || utilization_pct <= 0) return 0;
  if (!gpu_hour_price || gpu_hour_price <= 0) return 0;
  const total_gpus = num_racks * gpu.density_per_rack;
  const util_ratio = utilization_pct / 100;
  const HOURS_PER_YEAR = 8760;
  return total_gpus * util_ratio * HOURS_PER_YEAR * gpu_hour_price;
}


/**
 * Densités + GPU hardware CAPEX/revenue pour un mix donné. Pure — co-located with
 * its GPU deps so the simulate route AND the capital_first solver/tests share one
 * source of truth (P0-3: the solver must see the engine's true hardware CAPEX).
 * Returns null when there is no hardware_mix.
 *
 * @param {{total_mw?:number}} scenario
 * @param {object|null} hardware_mix
 * @returns {object|null}
 */
export function calcHardwareBreakdown(scenario, hardware_mix) {
  if (!hardware_mix) return null;
  const {
    classic_pct = 100,
    liquid_pct = 0,
    ai_pct = 0,
    gpu_sku_id,
    num_racks,
    utilization_pct = 75,
    gpu_hour_price,
  } = hardware_mix;

  const total_mw = scenario.total_mw || 0;
  const mw_classic = total_mw * (classic_pct / 100);
  const mw_liquid = total_mw * (liquid_pct / 100);
  const mw_ai = total_mw * (ai_pct / 100);

  let capex_hardware = 0;
  let revenue_ai_annual = 0;
  let total_gpus = 0;
  let gpu_info = null;

  if (ai_pct > 0 && gpu_sku_id && GPU_BY_ID[gpu_sku_id]) {
    const gpu = GPU_BY_ID[gpu_sku_id];
    gpu_info = gpu;
    const rack_kw = calcRackPower(gpu);
    const derived_racks = rack_kw > 0 ? Math.floor((mw_ai * 1000) / rack_kw) : 0;
    const racks_used = num_racks != null && num_racks > 0 ? num_racks : derived_racks;

    capex_hardware = calcGpuCapex(racks_used, gpu);
    total_gpus = racks_used * gpu.density_per_rack;
    if (gpu_hour_price != null && gpu_hour_price > 0) {
      revenue_ai_annual = calcGpuAnnualRevenue(racks_used, gpu, utilization_pct, gpu_hour_price);
    }
  }

  return {
    mw_classic,
    mw_liquid,
    mw_ai,
    capex_hardware,
    revenue_ai_annual,
    total_gpus,
    gpu: gpu_info ? {
      id: gpu_info.id,
      sku: gpu_info.sku,
      vendor: gpu_info.vendor,
      tdp_w: gpu_info.tdp_w,
      density_per_rack: gpu_info.density_per_rack,
      rack_scale: gpu_info.rack_scale,
    } : null,
  };
}

