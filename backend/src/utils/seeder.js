import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password123";

const countries = [
  "United States", "United Kingdom", "Germany", "Japan", 
  "India", "Canada", "Australia", "France"
];
const browsers = ["Chrome", "Firefox", "Safari", "Edge"];
const osList = ["Windows", "macOS", "Linux", "iOS", "Android"];
const devices = ["Desktop", "Mobile", "Tablet"];
const ips = [
  "8.8.8.8", "1.1.1.1", "185.190.140.10", "140.82.112.4", 
  "82.165.196.16", "207.241.224.2", "192.30.252.153"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedDatabase() {
  try {
    // 0. Ensure role column exists in users table
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");

    // Seed admin user
    const ADMIN_EMAIL = "admin@example.com";
    const ADMIN_PASSWORD = "Admin@123";
    const adminCheck = await pool.query("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
    if (adminCheck.rowCount === 0) {
      console.log(`[Seeder] Creating admin user: ${ADMIN_EMAIL}...`);
      const hashedAdminPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["Admin User", ADMIN_EMAIL, hashedAdminPassword, "admin"]
      );
    } else {
      // Ensure existing admin has the correct role
      await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [ADMIN_EMAIL]);
    }

    // 1. Check if demo user exists
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [DEMO_EMAIL]);
    let userId;

    if (userRes.rowCount === 0) {
      console.log(`[Seeder] Creating demo user: ${DEMO_EMAIL}...`);
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
      const insertUser = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
        ["Demo User", DEMO_EMAIL, hashedPassword]
      );
      userId = insertUser.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
    }

    // 2. Check if demo user has any URLs
    const urlRes = await pool.query("SELECT id FROM urls WHERE user_id = $1", [userId]);
    
    if (urlRes.rowCount === 0) {
      console.log("[Seeder] Seeding default URLs and mock traffic...");

      const urlsToSeed = [
        { original: "https://github.com/facebook/react", code: "react-repo" },
        { original: "https://news.ycombinator.com", code: "hn-news" },
        { original: "https://tailwindcss.com/docs", code: "tw-docs" }
      ];

      for (const item of urlsToSeed) {
        // Insert URL
        const insertUrl = await pool.query(
          "INSERT INTO urls (original_url, short_code, user_id) VALUES ($1, $2, $3) RETURNING id",
          [item.original, item.code, userId]
        );
        const urlId = insertUrl.rows[0].id;

        // Generate 20-30 mock visits for this URL
        const visitCount = Math.floor(Math.random() * 15) + 15; // 15 to 30 clicks
        console.log(`[Seeder] Generating ${visitCount} visits for /${item.code}...`);

        for (let i = 0; i < visitCount; i++) {
          // Spread visits over the last 7 days
          const daysAgo = Math.random() * 7;
          const visitDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          
          const ip = getRandomItem(ips);
          const browser = getRandomItem(browsers);
          const os = getRandomItem(osList);
          const device = getRandomItem(devices);
          const country = getRandomItem(countries);
          const userAgent = `Mozilla/5.0 (${os === "macOS" ? "Macintosh" : os === "Windows" ? "Windows NT 10.0" : "Linux"}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser}/120.0.0.0 Safari/537.36`;

          await pool.query(
            `INSERT INTO visits (url_id, visited_at, ip_address, user_agent, browser, os, device, country)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [urlId, visitDate, ip, userAgent, browser, os, device, country]
          );
        }

        // Update click count on URL
        await pool.query(
          "UPDATE urls SET clicks = $1 WHERE id = $2",
          [visitCount, urlId]
        );
      }

      console.log("[Seeder] Seeding completed successfully!");
    } else {
      console.log("[Seeder] Demo data already exists. Skipping seed.");
    }
  } catch (error) {
    console.error("[Seeder] Error seeding database:", error);
  }
}
