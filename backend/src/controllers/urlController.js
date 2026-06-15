import pool from "../config/db.js";
import { generateShortCode } from "../services/shortCodeGenerator.js";
import { isValidUrl } from "../utils/validateUrl.js";
import { parseUserAgent } from "../utils/userAgentParser.js";
import { getCountryFromIp } from "../utils/geoIp.js";

const aliasPattern = /^[a-zA-Z0-9_-]{3,20}$/;

function getShortUrl(shortCode) {
  return `${process.env.BASE_URL || "http://localhost:5000"}/${shortCode}`;
}

async function createUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateShortCode();
    const existing = await pool.query("SELECT id FROM urls WHERE short_code = $1", [code]);

    if (existing.rowCount === 0) {
      return code;
    }
  }

  throw new Error("Unable to generate unique short code");
}

export async function createShortUrl(req, res) {
  const originalUrl = req.body.originalUrl?.trim();
  const customAlias = req.body.customAlias?.trim();
  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;

  if (!originalUrl || !isValidUrl(originalUrl)) {
    return res.status(400).json({ message: "A valid http or https URL is required" });
  }

  if (customAlias && !aliasPattern.test(customAlias)) {
    return res.status(400).json({
      message: "Custom alias must be 3-20 characters and use only letters, numbers, hyphens, or underscores"
    });
  }

  if (expiresAt && isNaN(expiresAt.getTime())) {
    return res.status(400).json({ message: "Invalid expiry date format" });
  }

  if (expiresAt && expiresAt < new Date()) {
    return res.status(400).json({ message: "Expiry date must be in the future" });
  }

  try {
    const shortCode = customAlias || await createUniqueCode();
    const existing = await pool.query("SELECT id FROM urls WHERE short_code = $1", [shortCode]);

    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Short code is already in use" });
    }

    const result = await pool.query(
      `INSERT INTO urls (original_url, short_code, user_id, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, original_url, short_code, clicks, user_id, created_at, expires_at`,
      [originalUrl, shortCode, req.user.id, expiresAt]
    );

    return res.status(201).json({
      url: {
        ...result.rows[0],
        shortUrl: getShortUrl(shortCode)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to shorten URL" });
  }
}

export async function getUserUrls(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.original_url, u.short_code, u.clicks, u.created_at, u.expires_at
       FROM urls u
       WHERE u.user_id = $1
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      urls: result.rows.map((url) => ({
        ...url,
        shortUrl: getShortUrl(url.short_code)
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load URLs" });
  }
}

export async function deleteUrl(req, res) {
  try {
    const result = await pool.query(
      "DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "URL not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to delete URL" });
  }
}

export async function redirectToOriginalUrl(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, original_url, short_code, user_id, expires_at FROM urls WHERE short_code = $1",
      [req.params.shortCode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    const url = result.rows[0];

    if (url.expires_at && new Date() > new Date(url.expires_at)) {
      res.setHeader("Content-Type", "text/html");
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #334155; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; border: 1px solid #e2e8f0; }
            h1 { color: #dc2626; margin-top: 0; font-size: 1.75rem; font-weight: 800; }
            p { line-height: 1.6; font-size: 1rem; color: #64748b; }
            .icon { font-size: 3rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Link Expired</h1>
            <p>This shortened link has expired on ${new Date(url.expires_at).toLocaleString()} and is no longer available.</p>
          </div>
        </body>
        </html>
      `);
    }

    const updatedUrl = await pool.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE id = $1 RETURNING clicks",
      [url.id]
    );

    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : rawIp;
    const userAgent = req.headers["user-agent"] || "";

    const { browser, os, device } = parseUserAgent(userAgent);
    const country = await getCountryFromIp(ip);

    const visit = await pool.query(
      `INSERT INTO visits (url_id, ip_address, user_agent, browser, os, device, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, visited_at, ip_address, user_agent, browser, os, device, country`,
      [url.id, ip, userAgent, browser, os, device, country]
    );

    const io = req.app.get("io");
    if (io && url.user_id) {
      io.to(`user:${url.user_id}`).emit("url:clicked", {
        urlId: url.id,
        shortCode: url.short_code,
        clicks: updatedUrl.rows[0].clicks,
        visit: visit.rows[0]
      });
    }

    return res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to redirect" });
  }
}

export async function updateUrl(req, res) {
  const { originalUrl, expiresAt } = req.body;
  const urlId = req.params.id;

  if (originalUrl && !isValidUrl(originalUrl)) {
    return res.status(400).json({ message: "A valid http or https URL is required" });
  }

  const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
  if (expiresAt && isNaN(parsedExpiresAt.getTime())) {
    return res.status(400).json({ message: "Invalid expiry date format" });
  }

  try {
    const ownerCheck = await pool.query(
      "SELECT id FROM urls WHERE id = $1 AND user_id = $2",
      [urlId, req.user.id]
    );

    if (ownerCheck.rowCount === 0) {
      return res.status(404).json({ message: "URL not found or unauthorized" });
    }

    let result;
    if (originalUrl && expiresAt !== undefined) {
      result = await pool.query(
        `UPDATE urls SET original_url = $1, expires_at = $2
         WHERE id = $3 AND user_id = $4
         RETURNING id, original_url, short_code, clicks, created_at, expires_at`,
        [originalUrl, parsedExpiresAt, urlId, req.user.id]
      );
    } else if (originalUrl) {
      result = await pool.query(
        `UPDATE urls SET original_url = $1
         WHERE id = $2 AND user_id = $3
         RETURNING id, original_url, short_code, clicks, created_at, expires_at`,
        [originalUrl, urlId, req.user.id]
      );
    } else if (expiresAt !== undefined) {
      result = await pool.query(
        `UPDATE urls SET expires_at = $1
         WHERE id = $2 AND user_id = $3
         RETURNING id, original_url, short_code, clicks, created_at, expires_at`,
        [parsedExpiresAt, urlId, req.user.id]
      );
    } else {
      return res.status(400).json({ message: "Nothing to update" });
    }

    return res.json({
      url: {
        ...result.rows[0],
        shortUrl: getShortUrl(result.rows[0].short_code)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update URL" });
  }
}

export async function getAdminUrls(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.original_url, u.short_code, u.clicks, u.created_at, u.expires_at,
              u.user_id, us.name AS creator_name, us.email AS creator_email
       FROM urls u
       LEFT JOIN users us ON u.user_id = us.id
       ORDER BY u.created_at DESC`
    );

    return res.json({
      urls: result.rows.map((url) => ({
        ...url,
        shortUrl: getShortUrl(url.short_code)
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load all URLs for admin" });
  }
}

export async function adminDeleteUrl(req, res) {
  try {
    const result = await pool.query(
      "DELETE FROM urls WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "URL not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to delete URL" });
  }
}

export async function adminUpdateUrl(req, res) {
  const { originalUrl, expiresAt } = req.body;
  const urlId = req.params.id;

  if (originalUrl && !isValidUrl(originalUrl)) {
    return res.status(400).json({ message: "A valid http or https URL is required" });
  }

  const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
  if (expiresAt && isNaN(parsedExpiresAt.getTime())) {
    return res.status(400).json({ message: "Invalid expiry date format" });
  }

  try {
    let result;
    if (originalUrl && expiresAt !== undefined) {
      result = await pool.query(
        `UPDATE urls SET original_url = $1, expires_at = $2
         WHERE id = $3
         RETURNING id, original_url, short_code, clicks, created_at, expires_at`,
        [originalUrl, parsedExpiresAt, urlId]
      );
    } else if (originalUrl) {
      result = await pool.query(
        `UPDATE urls SET original_url = $1
         WHERE id = $2
         RETURNING id, original_url, short_code, clicks, created_at, expires_at`,
        [originalUrl, urlId]
      );
    } else if (expiresAt !== undefined) {
      result = await pool.query(
        `UPDATE urls SET expires_at = $1
         WHERE id = $2
         RETURNING id, original_url, short_code, clicks, created_at, expires_at`,
        [parsedExpiresAt, urlId]
      );
    } else {
      return res.status(400).json({ message: "Nothing to update" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "URL not found" });
    }

    return res.json({
      url: {
        ...result.rows[0],
        shortUrl: getShortUrl(result.rows[0].short_code)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update URL" });
  }
}

export async function getDbInspectorData(req, res) {
  try {
    const usersResult = await pool.query("SELECT id, name, email, role, created_at, SUBSTRING(password, 1, 12) || '...' AS password FROM users ORDER BY id ASC");
    const urlsResult = await pool.query("SELECT id, original_url, short_code, clicks, user_id, created_at, expires_at FROM urls ORDER BY id ASC");
    const visitsResult = await pool.query("SELECT id, url_id, visited_at, ip_address, browser, os, device, country FROM visits ORDER BY id ASC");

    return res.json({
      users: usersResult.rows,
      urls: urlsResult.rows,
      visits: visitsResult.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to load database inspector data" });
  }
}

