export function parseUserAgent(uaString) {
  if (!uaString) {
    return {
      browser: "Unknown",
      os: "Unknown",
      device: "Desktop"
    };
  }

  const ua = uaString.toLowerCase();
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Device detection
  if (ua.includes("ipad") || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobi"))) {
    device = "Tablet";
  } else if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("ipod") || ua.includes("android") || ua.includes("windows phone")) {
    device = "Mobile";
  }

  // Browser detection
  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera";
  } else if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Chrome";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")) {
    browser = "Safari";
  } else if (ua.includes("trident") || ua.includes("msie")) {
    browser = "Internet Explorer";
  }

  // OS detection
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os x") || ua.includes("macintosh") || ua.includes("mac_powerpc")) {
    os = "macOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  return { browser, os, device };
}
