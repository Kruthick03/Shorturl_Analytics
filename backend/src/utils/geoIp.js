export async function getCountryFromIp(ip) {
  if (!ip) {
    return "Unknown Country";
  }

  const cleanIp = ip.trim();

  // Local/private IP detection
  if (
    cleanIp === "::1" ||
    cleanIp === "127.0.0.1" ||
    cleanIp.startsWith("::ffff:127.0.0.1") ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.")
  ) {
    return "Localhost";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`https://freeipapi.com/api/json/${cleanIp}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.countryName || "Unknown Country";
    }
  } catch (err) {
    console.error("GeoIP lookup failed:", err.message);
  }

  return "Unknown Country";
}
