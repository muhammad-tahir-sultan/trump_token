import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return { api_key, api_secret, cloud_name };
}

export async function uploadPaymentScreenshot(buffer: Buffer, userId: string) {
  const config = getCloudinaryConfig();
  cloudinary.config(config);

  return new Promise<string>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "rivochain/payment-screenshots",
        public_id: `${userId}-${Date.now()}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result.secure_url);
      },
    );

    upload.end(buffer);
  });
}
