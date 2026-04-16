#  Website Technologies Detector

A lightweight engine that crawls websites and detects technologies based on heuristic signals (HTML, headers, cookies, scripts, and meta tags).


## Problem #1: Extracting domains from a parquet file

### Problem
The input dataset provided was a compressed `.snappy.parquet` file, unusable directly.

### Approach
I used Python with `pandas` and `pyarrow` to read and extract the contents and utilize them in my project further.


## Problem #2: Fetching websites reliably without using a library

Given Axios' recent [RAT](https://unit42.paloaltonetworks.com/axios-supply-chain-attack/) problem, I decided to make my own simple fetcher.
### Problem

Not all domains respond consistently:
* some block bots
* some redirect infinitely
* some timeout or return empty responses
### Approach

I implemented a simple fetcher (`fetcher.js`) that:

* normalizes URLs (adds https:// if missing)
* uses a realistic browser-like User-Agent
* follows redirects
* extracts:
   * HTML
   * headers
   * cookies
   * script sources
   * meta tags

Failures are handled and marked as `fetch_failed`.


## Problem #3: Detecting technologies
### Problem

Detection must rely on heuristics, which can be noisy and inconsistent.

### Approach

I designed a simple rule-based detection engine:

* Each technology has multiple signals
* Each signal has:
type (html, headers, cookies, js, meta)
patterns
weight

Detection computes a confidence score:

`confidence = matched_weight / total_weight`

This allows partial matches and avoids binary (true/false) detection.

## Problem #4: Handling multiple domains efficiently
### Problem

Processing domains sequentially is too slow.

### Approach

I implemented:

* batching (`chunkArray`)
* concurrency control (`Promise.allSettled`)
* rate limiting (`sleep` between batches)

This ensures:
* controlled load
* fewer bans

## Problem #5: Aggregating results
### Problem

Technologies repeat across domains, making it hard to understand overall coverage.

### Approach

After processing, I added a utility:

`function countUniqueTechnologies()`

In order to output the total unique technologies detected in the console.


## Current Limitations
* False positives: some patterns (e.g. "react", "bootstrap") are too generic.
* Weak signals: detections rely only on HTML string matching.
* No hierarchy awareness (e.g. `Next.js` implies `React` but both may appear separately)

* No co-occurrence logic: some technologies should boost confidence when seen together.
* Static rules: rules must be manually updated.
* No dynamic rendering support: JavaScript-heavy websites may not be fully analyzed since the current approach only processes static HTML responses.

## How I would improve it
## 1. Better scoring system
* introduce signal rarity weighting
* penalize overly generic patterns
* add negative signals (to suppress false positives)
## 2. Technology hierarchy

Example:

* `React < Next.js < Vercel`

If Next.js is detected:

* boost Next.js confidence
* optionally suppress React
## 3. Co-occurrence rules

Example:

* WordPress + Elementor should indicate a stronger WordPress confidence
* Shopify + Shopify Payments should confirm Shopify stack
## 4. Signal deduplication

Avoid counting:

* multiple matches of same pattern
* repeated script references

## 5. Dynamic rendering (JavaScript-heavy websites)
If a page relies heavily on client-side rendering:
* use a headless browser (e.g. Puppeteer) to execute JavaScript
* extract fully rendered DOM after page load

## Scaling to millions of domains

To handle millions of domains in 1–2 months:

## Infrastructure
* distributed workers (queues like Redis / Kafka)
* horizontal scaling (multiple machines)
## Crawling strategy
* async queue with retry logic
* per-domain rate limiting
* smart timeouts
## Storage
* stream results instead of keeping everything in memory
* use a database
## Optimization
* cache DNS + TLS results
* skip already processed domains
* prioritize responsive domains
## Discovering new technologies
## 1. Pattern mining
* analyze unknown HTML/script patterns at scale
* cluster frequently occurring strings
## 2. Script source analysis
* extract external JS domains
* map them to known providers
## 3. Feedback loop
* log "unknown but frequent" signals
* manually review and add to rules
## 4. Public datasets
* compare against tools like Wappalyzer/BuiltWith
* enrich rule base
## Summary

This project is a rule-based technology detector that:

* crawls websites
* extracts multiple signal types
* computes confidence scores
* processes domains in parallel

It is currently simple, but extensible toward:

* smarter scoring
* large-scale crawling
* automated rule discovery

## How to Run

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate processed domains file

Run the Python extractor to process the parquet dataset:
```bash
python extractor.py
```
This will generate:
```bash
input/processed/domains.json
```
### 3. Install Node dependencies

```bash
npm install
```

### 4. Run the project

```bash
npm start
```