import fs from "fs";
import { fetchWebsite } from "./fetcher.js";
import { detectTechnologies } from "./detector.js";



const INPUT_FILE = "./input/processed/domains.json";
const OUTPUT_FILE = "./output/results.json";

const CONCURRENCY_LIMIT = 5;
const BATCH_DELAY = 300;

function countUniqueTechnologies() {
  const data = JSON.parse(
    fs.readFileSync("./output/results.json", "utf-8")
  );

  const uniqueResults = {};

  for (const result of data) {
    if (!result.technologies) continue;

    for (const tech of result.technologies) {
      if (tech && tech.name) {
        uniqueResults[tech.name] = true;
      }
    }
  }

  const uniqueTechNames = Object.keys(uniqueResults);

  console.log(`Unique technologies: ${uniqueTechNames.length}`);

}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}



const rules = JSON.parse(
  fs.readFileSync(new URL("./rules.json", import.meta.url), "utf-8")
);



function loadDomains(path) {
  return fs
    .readFileSync(path, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line).root_domain;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}


async function processDomain(domain) {
  console.log(`[INFO] ${domain}`);

  try {
    const data = await fetchWebsite(domain);

    if (!data || !data.html) {
      return {
        domain,
        technologies: [],
        error: "fetch_failed"
      };
    }

    const technologies = detectTechnologies(data, rules);

    return {
      domain,
      technologies
    };
  } catch (err) {
    return {
      domain,
      technologies: [],
      error: err.message || "unknown_error"
    };
  }
}


async function main() {
  const domains = loadDomains(INPUT_FILE);

  console.log(`[INFO] Loaded ${domains.length} domains`);

  const chunks = chunkArray(domains, CONCURRENCY_LIMIT);
  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(
      `\n[INFO] Batch ${i + 1}/${chunks.length} (${chunk.length} domains)`
    );

    const batchResults = await Promise.allSettled(
      chunk.map((domain) => processDomain(domain))
    );

    results.push(
      ...batchResults.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { technologies: [], error: "process_failed" }
      )
    );

    await sleep(BATCH_DELAY);
  }

  fs.mkdirSync("./output", { recursive: true });

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(results, null, 2),
    "utf-8"
  );

  console.log(`\nDone. Saved to ${OUTPUT_FILE}`);
}

await main();
countUniqueTechnologies();