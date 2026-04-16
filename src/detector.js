export function detectTechnologies(data, rules) {
  const html = (data.html || "").toLowerCase();
  const headers = JSON.stringify(data.headers || {}).toLowerCase();
  const cookies = JSON.stringify(data.cookies || {}).toLowerCase();
  const scripts = JSON.stringify(data.scripts || []).toLowerCase();
  const meta = JSON.stringify(data.meta || []).toLowerCase();

  const results = [];

  for (const [name, tech] of Object.entries(rules || {})) {
    if (!tech.signals) continue;

    let score = 0;
    let maxScore = 0;

    for (const signal of tech.signals) {
      const weight = signal.weight || 1;
      maxScore += weight;

      const patterns = signal.patterns || [];

      let input = "";

      if (signal.type === "html") input = html;
      else if (signal.type === "headers") input = headers;
      else if (signal.type === "cookies") input = cookies;
      else if (signal.type === "js") input = scripts;
      else if (signal.type === "meta") input = meta;
      else input = "";

      const matched = patterns.some(p =>
        input.includes(p.toLowerCase())
      );

      if (matched) {
        score += weight;
      }
    }

    if (maxScore === 0) continue;

    const confidence = score / maxScore;

    if (confidence > 0) {
      results.push({
        name,
        confidence: Number(confidence.toFixed(2))
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}