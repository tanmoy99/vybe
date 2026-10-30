#!/usr/bin/env node
/**
 * Imports NSW suburbs (ABS ASGS Edition 3, 2021 "Suburbs and Localities") and the
 * Greater Sydney GCCSA boundary into Supabase. Re-runnable (upserts).
 *
 * Source: Australian Bureau of Statistics, ASGS Edition 3 digital boundaries,
 * © Commonwealth of Australia, licensed CC BY 4.0. Served by geo.abs.gov.au.
 * Boundaries are generalised (~30 m) to keep the table small; centroids are
 * computed in PostGIS with ST_PointOnSurface (always inside the suburb).
 *
 * Usage: SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/import-suburbs.mjs
 * The secret key is only needed for this admin task and must never be committed.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const ABS = "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021";
const PAGE = 500;

async function getJson(href) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(href);
    if (res.ok) return res.json();
    console.warn(`  ${res.status} from ABS, retrying (${attempt})`);
    await new Promise((r) => setTimeout(r, attempt * 2000));
  }
  throw new Error(`ABS request failed: ${href}`);
}

async function importSuburbs(stateCode, stateAbbr) {
  const count = (await getJson(`${ABS}/SAL/MapServer/0/query?where=state_code_2021%3D%27${stateCode}%27&returnCountOnly=true&f=json`)).count;
  console.log(`${stateAbbr}: ${count} suburbs`);
  let imported = 0;
  for (let offset = 0; offset < count; offset += PAGE) {
    const q = new URLSearchParams({
      where: `state_code_2021='${stateCode}'`,
      outFields: "sal_code_2021,sal_name_2021",
      returnGeometry: "true",
      maxAllowableOffset: "0.0003",
      geometryPrecision: "5",
      outSR: "4326",
      orderByFields: "objectid",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
      f: "geojson",
    });
    const page = await getJson(`${ABS}/SAL/MapServer/0/query?${q}`);
    const { data, error } = await supabase.rpc("import_suburbs", { features: page.features, p_state: stateAbbr });
    if (error) throw new Error(`import_suburbs failed at offset ${offset}: ${error.message}`);
    imported += data;
    console.log(`  ${imported}/${count}`);
  }
}

async function importRegion(code) {
  const q = new URLSearchParams({
    where: `gccsa_code_2021='${code}'`,
    outFields: "gccsa_code_2021,gccsa_name_2021",
    returnGeometry: "true",
    maxAllowableOffset: "0.001",
    geometryPrecision: "5",
    outSR: "4326",
    f: "geojson",
  });
  const fc = await getJson(`${ABS}/GCCSA/MapServer/0/query?${q}`);
  const f = fc.features[0];
  const { error } = await supabase.rpc("import_region", {
    p_code: code,
    p_name: f.properties.gccsa_name_2021,
    geometry: f.geometry,
  });
  if (error) throw new Error(`import_region failed: ${error.message}`);
  console.log(`Region ${code} (${f.properties.gccsa_name_2021}) imported and assigned.`);
}

await importSuburbs("1", "NSW");
await importRegion("1GSYD");
console.log("Done.");
