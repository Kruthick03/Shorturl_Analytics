import pool from "../config/db.js";

function getShortUrl(shortCode) {
  return `${process.env.BASE_URL || "http://localhost:5000"}/${shortCode}`;
}

export async function getUrlAnalytics(req, res) {
  try {
    const ownerCheck = await pool.query(
      "SELECT id, original_url, short_code, clicks, created_at FROM urls WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (ownerCheck.rowCount === 0) {
      return res.status(404).json({ message: "URL not found" });
    }

    const [
      lastVisitResult,
      recentVisitsResult,
      dailyTrendResult,
      browserResult,
      osResult,
      deviceResult,
      countryResult
    ] = await Promise.all([
      pool.query(
        "SELECT visited_at FROM visits WHERE url_id = $1 ORDER BY visited_at DESC LIMIT 1",
        [req.params.id]
      ),
      pool.query(
        "SELECT id, visited_at, ip_address, browser, os, device, country FROM visits WHERE url_id = $1 ORDER BY visited_at DESC LIMIT 20",
        [req.params.id]
      ),
      pool.query(
        `SELECT DATE(visited_at) AS date, COUNT(*)::int AS clicks
         FROM visits
         WHERE url_id = $1
         GROUP BY DATE(visited_at)
         ORDER BY date ASC
         LIMIT 30`,
        [req.params.id]
      ),
      pool.query(
        "SELECT browser, COUNT(*)::int AS count FROM visits WHERE url_id = $1 GROUP BY browser ORDER BY count DESC",
        [req.params.id]
      ),
      pool.query(
        "SELECT os, COUNT(*)::int AS count FROM visits WHERE url_id = $1 GROUP BY os ORDER BY count DESC",
        [req.params.id]
      ),
      pool.query(
        "SELECT device, COUNT(*)::int AS count FROM visits WHERE url_id = $1 GROUP BY device ORDER BY count DESC",
        [req.params.id]
      ),
      pool.query(
        "SELECT country, COUNT(*)::int AS count FROM visits WHERE url_id = $1 GROUP BY country ORDER BY count DESC",
        [req.params.id]
      )
    ]);

    return res.json({
      url: {
        ...ownerCheck.rows[0],
        shortUrl: getShortUrl(ownerCheck.rows[0].short_code)
      },
      totalClicks: ownerCheck.rows[0].clicks,
      lastVisited: lastVisitResult.rows[0]?.visited_at || null,
      recentVisits: recentVisitsResult.rows,
      dailyTrend: dailyTrendResult.rows,
      browsers: browserResult.rows,
      os: osResult.rows,
      devices: deviceResult.rows,
      countries: countryResult.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load analytics" });
  }
}

export async function getPublicAnalytics(req, res) {
  try {
    const urlResult = await pool.query(
      "SELECT id, original_url, short_code, clicks, created_at FROM urls WHERE short_code = $1",
      [req.params.shortCode]
    );

    if (urlResult.rowCount === 0) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    const url = urlResult.rows[0];

    const [lastVisitResult, dailyTrendResult] = await Promise.all([
      pool.query(
        "SELECT visited_at FROM visits WHERE url_id = $1 ORDER BY visited_at DESC LIMIT 1",
        [url.id]
      ),
      pool.query(
        `SELECT DATE(visited_at) AS date, COUNT(*)::int AS clicks
         FROM visits
         WHERE url_id = $1
         GROUP BY DATE(visited_at)
         ORDER BY date ASC
         LIMIT 30`,
        [url.id]
      )
    ]);

    return res.json({
      url: {
        original_url: url.original_url,
        short_code: url.short_code,
        created_at: url.created_at,
        clicks: url.clicks,
        shortUrl: getShortUrl(url.short_code)
      },
      totalClicks: url.clicks,
      lastVisited: lastVisitResult.rows[0]?.visited_at || null,
      dailyTrend: dailyTrendResult.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load public stats" });
  }
}
