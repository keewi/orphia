/**
 * Crop Playbill banners from poster images.
 *
 * Re-downloads the original Playbill poster images from Wikipedia,
 * detects the yellow "PLAYBILL" banner at the top via pixel color analysis,
 * crops it off, and uploads the cropped poster to Supabase Storage.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && node scripts/fix-playbill-images.mjs
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Run with:\n  export $(grep -v '^#' .env.local | xargs) && node scripts/fix-playbill-images.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BUCKET = "posters";

// ── Musicals identified with Playbill-banner images ──
const PLAYBILL_IDS = [
  "beetlejuice",
  "dreamgirls",
  "fiddler-on-the-roof",
  "footloose",
  "kiss-of-the-spider-woman",
  "man-of-la-mancha",
  "parade",
  "little-mermaid",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Find the original Playbill image from Wikipedia (NO filtering) ──
// We WANT the Playbill image so we can crop the banner off.

async function findPlaybillImage(title, year) {
  const base = title.replace(/['']/g, "'");
  const searchTitles = [
    `${base} (musical)`,
    `${base} (${year} musical)`,
    base,
  ];

  for (const searchTitle of searchTitles) {
    const encoded = encodeURIComponent(searchTitle.replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();

      // Prefer originalimage for higher quality
      const imageUrl =
        data.originalimage?.source ||
        data.thumbnail?.source?.replace(/\/\d+px-/, "/600px-");

      if (!imageUrl) continue;
      return imageUrl;
    } catch {
      // Network error, try next
    }

    await sleep(1000);
  }

  return null;
}

// ── Detect yellow Playbill banner height ──
// Scans rows from the top looking for the distinctive yellow banner.
// The Playbill banner is bright yellow: high R (>180), high G (>160), low B (<100).
// We find where the yellow region ends and crop there.

async function detectBannerHeight(buffer) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // Extract raw pixel data (RGB)
  const { data: pixels } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = metadata.channels || 3;

  // Scan rows from top. A row is "yellow" if >40% of pixels are yellowish.
  // The Playbill banner is typically the top ~12-18% of the image.
  // We scan up to the top 30% max to be safe.
  const maxScanRow = Math.floor(height * 0.30);

  let lastYellowRow = -1;

  for (let row = 0; row < maxScanRow; row++) {
    let yellowPixels = 0;

    for (let col = 0; col < width; col++) {
      const idx = (row * width + col) * channels;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Yellow detection: high red, high green, low blue
      // The Playbill yellow is roughly RGB(206, 181, 59) to RGB(255, 223, 0)
      // We use generous thresholds to catch variations in scan quality
      if (r > 150 && g > 130 && b < 120 && r > b * 1.5 && g > b * 1.3) {
        yellowPixels++;
      }
    }

    const yellowRatio = yellowPixels / width;

    // If more than 40% of the row is yellow, it's part of the banner
    if (yellowRatio > 0.40) {
      lastYellowRow = row;
    }
  }

  if (lastYellowRow < 0) {
    // No yellow banner detected
    return 0;
  }

  // Add a small buffer below the last yellow row to clear any remaining
  // theatre name text that sits just below the yellow banner.
  // The theatre name area is typically ~3-5% of the image height.
  const buffer_rows = Math.floor(height * 0.04);
  const cropY = Math.min(lastYellowRow + buffer_rows, Math.floor(height * 0.30));

  return cropY;
}

// ── Download image ──

async function downloadImage(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Crop and upload ──

async function cropAndUpload(musicalId, buffer, imageUrl) {
  const bannerHeight = await detectBannerHeight(buffer);

  if (bannerHeight === 0) {
    console.log(`    No yellow banner detected, uploading as-is`);
  } else {
    console.log(`    Detected banner height: ${bannerHeight}px, cropping...`);
  }

  // Crop the banner off the top
  const metadata = await sharp(buffer).metadata();
  let outputBuffer;

  if (bannerHeight > 0) {
    outputBuffer = await sharp(buffer)
      .extract({
        left: 0,
        top: bannerHeight,
        width: metadata.width,
        height: metadata.height - bannerHeight,
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    // No cropping needed, just re-encode as JPEG
    outputBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
  }

  // Upload to Supabase Storage
  const filePath = `${musicalId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, outputBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL and update DB with cache-busting param
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("musicals")
    .update({ image_url: cacheBustedUrl })
    .eq("id", musicalId);

  if (updateError) {
    throw new Error(`DB update failed: ${updateError.message}`);
  }

  return cacheBustedUrl;
}

// ── Main ──

const { data: musicals, error } = await supabase
  .from("musicals")
  .select("id, title, year")
  .in("id", PLAYBILL_IDS)
  .order("title");

if (error) {
  console.error("Failed to fetch musicals:", error.message);
  process.exit(1);
}

console.log(`Found ${musicals.length} musicals to crop.\n`);

let success = 0;
let failed = 0;

for (const musical of musicals) {
  console.log(`  Processing: ${musical.title}...`);

  const imageUrl = await findPlaybillImage(musical.title, musical.year);
  if (!imageUrl) {
    console.log(`  [SKIP] No Wikipedia image found for: ${musical.title}`);
    failed++;
    await sleep(3000);
    continue;
  }

  console.log(`    Source: ${imageUrl.substring(0, 80)}...`);

  try {
    const buffer = await downloadImage(imageUrl);
    console.log(`    Downloaded: ${(buffer.length / 1024).toFixed(0)} KB`);

    await cropAndUpload(musical.id, buffer, imageUrl);
    console.log(`  [OK] ${musical.title}`);
    success++;
  } catch (err) {
    console.log(`  [ERROR] ${musical.title}: ${err.message}`);
    failed++;
  }

  await sleep(3000);
}

console.log(`\nDone: ${success} cropped, ${failed} skipped/failed`);
