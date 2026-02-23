/**
 * Fetch poster images from Wikipedia for all musicals and upload to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/source-posters.mjs
 *
 * The service role key can be found in Supabase Dashboard → Settings → API.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Run with:\n  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/source-posters.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BUCKET = "posters";

// Wikipedia search strategies for a given musical
function buildSearchTitles(title, year) {
  const base = title.replace(/['']/g, "'");
  return [
    `${base} (musical)`,
    `${base} (${year} musical)`,
    base,
    `${base} (film)`,
  ];
}

async function findWikipediaImage(title, year) {
  const searchTitles = buildSearchTitles(title, year);

  for (const searchTitle of searchTitles) {
    const encoded = encodeURIComponent(searchTitle.replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();

      // Prefer originalimage for higher quality
      if (data.originalimage?.source) {
        // Skip Playbill program scans
        if (data.originalimage.source.toLowerCase().includes("playbill")) continue;
        return data.originalimage.source;
      }
      if (data.thumbnail?.source) {
        // Skip Playbill program scans
        if (data.thumbnail.source.toLowerCase().includes("playbill")) continue;
        // Request a larger version
        return data.thumbnail.source.replace(/\/\d+px-/, "/600px-");
      }
    } catch {
      // Network error, try next strategy
    }
  }

  return null;
}

async function downloadImage(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function processMusical(musical) {
  const imageUrl = await findWikipediaImage(musical.title, musical.year);
  if (!imageUrl) {
    console.log(`  [SKIP] No image found for: ${musical.title}`);
    return false;
  }

  try {
    // Download image
    const buffer = await downloadImage(imageUrl);

    // Determine content type from URL
    const ext = imageUrl.toLowerCase().includes(".png") ? "png" : "jpeg";
    const contentType = `image/${ext}`;
    const filePath = `${musical.id}.${ext === "png" ? "png" : "jpg"}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`  [ERROR] Upload failed for ${musical.title}:`, uploadError.message);
      return false;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    // Update database
    const { error: updateError } = await supabase
      .from("musicals")
      .update({ image_url: publicUrl })
      .eq("id", musical.id);

    if (updateError) {
      console.error(`  [ERROR] DB update failed for ${musical.title}:`, updateError.message);
      return false;
    }

    console.log(`  [OK] ${musical.title}`);
    return true;
  } catch (err) {
    console.error(`  [ERROR] ${musical.title}:`, err.message);
    return false;
  }
}

// ── Main ──

const { data: musicals, error } = await supabase
  .from("musicals")
  .select("id, title, year")
  .is("image_url", null)
  .order("title");

if (error) {
  console.error("Failed to fetch musicals:", error.message);
  process.exit(1);
}

console.log(`Found ${musicals.length} musicals without images.\n`);

let success = 0;
let skipped = 0;

for (const m of musicals) {
  const result = await processMusical(m);
  if (result) success++;
  else skipped++;

  // Rate limit: be polite to Wikipedia
  await new Promise((r) => setTimeout(r, 3000));
}

console.log(`\nDone: ${success} uploaded, ${skipped} skipped/failed`);
