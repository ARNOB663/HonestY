import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { getCloudinary, isConfigured } from "../../../../../lib/cloudinary";

// Returns a signature the browser can attach to a direct Cloudinary upload.
// Direct uploads keep heavy bytes off our serverless function and out of Mongo.
export const POST = withAdmin(async () => {
  if (!isConfigured()) throw httpError("Cloudinary is not configured. Set CLOUDINARY_* env vars.", 500);
  const cld = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "honesty";
  const signature = cld.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  return {
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
});
