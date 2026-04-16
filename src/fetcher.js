export async function fetchWebsite(domain) {
  let url = domain;

  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    const html = await res.text();


    const headers = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });


    const cookies = (res.headers.get("set-cookie") || "")
      .toLowerCase();


    const scripts = [];
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      scripts.push(match[1].toLowerCase());
    }


    const meta = [];
    const metaRegex = /<meta[^>]+content=["']([^"']+)["']/gi;

    while ((match = metaRegex.exec(html)) !== null) {
      meta.push(match[1].toLowerCase());
    }

    return {
      html,
      headers,
      cookies,
      scripts,
      meta,
      status: res.status
    };
  } catch (err) {
    console.error(`[ERROR] ${domain}`, err.message);
    return null;
  }
}