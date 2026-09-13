import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run against saved, timestamped public API responses; never modifies backend data.
const [countriesFile, universitiesFile, output = 'reports/destination-geography'] =
  process.argv.slice(2);
if (!countriesFile || !universitiesFile)
  throw new Error(
    'Usage: node scripts/audit-destination-geography.mjs countries.json universities.json [output-directory]',
  );
await mkdir(output, { recursive: true });
await mkdir('tmp/destination-audit', { recursive: true });
const bundle = resolve('tmp/destination-audit/geographic-auditor.mjs');
await build({
  entryPoints: [
    'src/app/students/static/dashboard/components/destinations-map/university-geographic-audit.ts',
  ],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: bundle,
});
const { auditUniversities } = await import(pathToFileURL(bundle).href + `?v=${Date.now()}`);
const countriesRaw = await readFile(countriesFile, 'utf8');
const universitiesRaw = await readFile(universitiesFile, 'utf8');
const parse = (raw) => {
  const value = JSON.parse(raw);
  return Array.isArray(value) ? value : value.data;
};
const countries = parse(countriesRaw),
  universities = parse(universitiesRaw);
if (!Array.isArray(countries) || !Array.isArray(universities))
  throw new Error('Invalid API response envelopes');
const rows = auditUniversities(universities, countries);
const statuses = Object.fromEntries(
  [
    'VALID',
    'INVALID',
    'MISSING_COORDINATES',
    'INVALID_COORDINATES',
    'COUNTRY_DATA_MISMATCH',
    'BOUNDARY_REQUIRES_VERIFICATION',
  ].map((status) => [status, rows.filter((r) => r.status === status).length]),
);
const report = {
  generatedAt: new Date().toISOString(),
  source: 'https://api2.mbbs.net/api/v1/cse/admin/',
  hashes: {
    countries: createHash('sha256').update(countriesRaw).digest('hex'),
    universities: createHash('sha256').update(universitiesRaw).digest('hex'),
  },
  totalCountries: countries.length,
  totalUniversities: universities.length,
  statuses,
  missingApiCoordinates: universities.filter((u) =>
    [u.latitude, u.longitude, u.lat, u.lng].every((v) => v == null || v === ''),
  ).length,
  countries: countries.map((c) => ({
    id: c._id,
    code: c.country_code,
    name: c.name,
    rows: rows.filter((r) => r.country?._id === c._id).length,
    directory: rows.filter((r) => r.country?._id === c._id && r.directoryEligible).length,
    markers: rows.filter((r) => r.country?._id === c._id && r.markerEligible).length,
  })),
  rows: rows.map((r) => ({
    id: r.university._id,
    name: r.university.name,
    assignedCountryId: r.university.country_id,
    assignedCountry: r.country?.name ?? null,
    assignedCountryCode: r.country?.country_code ?? null,
    city: r.university.city ?? null,
    locations: r.university.locations ?? [],
    website: r.university.official_website ?? null,
    description: r.university.description ?? null,
    rawCoordinates: {
      latitude: r.university.latitude ?? null,
      longitude: r.university.longitude ?? null,
      lat: r.university.lat ?? null,
      lng: r.university.lng ?? null,
    },
    coordinates: r.coordinates,
    coordinateSource: r.coordinateSource,
    detectedCountryCodes: r.detectedCountryCodes,
    status: r.status,
    verification: r.verification,
    reason: r.reason,
    directoryEligible: r.directoryEligible,
    markerEligible: r.markerEligible,
  })),
};
await writeFile(`${output}/audit.json`, JSON.stringify(report, null, 2) + '\n');
await writeFile(`${output}/countries.snapshot.json`, countriesRaw);
await writeFile(`${output}/universities.snapshot.json`, universitiesRaw);
const esc = (value) =>
  String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
let md = `# Destination geographic integrity audit\n\nGenerated: ${report.generatedAt}\n\nSource: ${report.source}countries and universities. Read-only snapshot; SHA-256 hashes are recorded in audit.json.\n\n`;
md += `Countries: **${countries.length}**. University records checked: **${rows.length}**. Records missing API coordinates: **${report.missingApiCoordinates}**.\n\n`;
md +=
  '| Result | Records |\n|---|---:|\n' +
  Object.entries(statuses)
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join('\n');
md +=
  '\n\nVALID means stable country ID and coordinate membership agree with the existing boundary geometry. It does not establish independently that a coordinate is the university campus. All other rows are DATA_REQUIRES_VERIFICATION. Missing-coordinate records remain in the assigned directory, explicitly unverified, with no marker. Confirmed country mismatches and invalid identities are quarantined from country directories; coordinates are never moved or swapped automatically.\n\nThe API supplies no geographic evidence for missing-coordinate records. Their actual campus country/location cannot be certified from counts, names, website domains or country IDs. The five previously sourced Turkish campuses are checked against the same boundaries. No additional campus coordinates have been invented.\n\nBoundary limitation: existing projected polygon paths have 0.1-unit rounding and incomplete source provenance. All rings are checked, including islands/holes; points near rounded edges, overlaps, absent polygons or outside every polygon require verification, not automatic rejection as a different country. This dataset is a consistency check, not a cadastral or geopolitical authority.\n\n## Every country\n\n| Country | API records | Directory | Verified markers |\n|---|---:|---:|---:|\n';
md += report.countries
  .map((c) => `| ${esc(c.name)} (${c.code}) | ${c.rows} | ${c.directory} | ${c.markers} |`)
  .join('\n');
md +=
  '\n\n## Every university record\n\n| ID / University | Assigned country | API city / region | Coordinates / source | Detected country | Status | Reason |\n|---|---|---|---|---|---|---|\n';
md += report.rows
  .map(
    (r) =>
      `| ${esc(r.id)} / ${esc(r.name)} | ${esc(r.assignedCountry)} | ${esc(r.city || r.locations.map((l) => [l.state, ...(l.cities ?? [])].filter(Boolean).join(', ')).join('; '))} | ${r.coordinates ? `${r.coordinates.lat}, ${r.coordinates.lng} (${r.coordinateSource})` : 'MISSING / INVALID'} | ${r.detectedCountryCodes.join(', ') || 'UNDETERMINED'} | ${r.status} | ${esc(r.reason)} |`,
  )
  .join('\n');
md +=
  '\n\n## Backend remediation\n\nReview every non-VALID row above. Store independently verified campus coordinates and an authoritative country ID in the backend, with campus identity, official source URL and verification date. Prioritize country conflicts and ambiguous border/territory/campus identities. The frontend audit does not update or substitute backend assignments.\n';
await writeFile(`${output}/AUDIT.md`, md);
console.log(
  JSON.stringify(
    {
      totalCountries: report.totalCountries,
      totalUniversities: report.totalUniversities,
      missingApiCoordinates: report.missingApiCoordinates,
      statuses,
      located: report.rows.filter((r) => r.coordinates),
    },
    null,
    2,
  ),
);
