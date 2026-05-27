import { NextResponse } from "next/server";
import { withAdmin } from "../../../../../lib/withAdmin";
import { getCloudinary, isConfigured } from "../../../../../lib/cloudinary";

// Pings Cloudinary with the configured credentials and surfaces any auth /
// cloud-name error so the admin can diagnose upload failures.
export const POST = withAdmin(async () => {
  const env = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    hasSecret: !!process.env.CLOUDINARY_API_SECRET,
  };

  if (!isConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "One or more CLOUDINARY_* env vars are missing.",
      env,
    });
  }

  // Cloud names are case-sensitive lowercase strings on Cloudinary. Capital-R
  // "Root" or other placeholder-looking values are almost certainly wrong.
  if (/^(replace_me|your[-_]?cloud|root)$/i.test(env.cloudName)) {
    return NextResponse.json({
      ok: false,
      error: `Cloud name "${env.cloudName}" looks like a placeholder. Replace it with your real Cloudinary cloud name (from the dashboard at cloudinary.com/console).`,
      env,
    });
  }

  try {
    const cld = getCloudinary();
    const pong = await cld.api.ping();
    return NextResponse.json({ ok: true, env, ping: pong });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e?.error?.message || e?.message || "Cloudinary returned an error",
      hint: e?.http_code === 401
        ? "401 Unauthorized — API key/secret pair is wrong, or doesn't match the cloud name."
        : undefined,
      env,
    });
  }
});
