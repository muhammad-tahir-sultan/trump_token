import { getMongoDatabase } from "@/features/auth/services/mongodb-client";

type SupportWhatsappDocument = {
  key: "support_whatsapp";
  phoneNumber: string;
  updatedAt: Date;
};

export function normalizeWhatsappNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidWhatsappNumber(value: string) {
  const normalized = normalizeWhatsappNumber(value);
  return normalized.length >= 8 && normalized.length <= 15;
}

export async function getSupportWhatsappNumber() {
  const database = await getMongoDatabase();
  const settings = database.collection<SupportWhatsappDocument>("settings");
  const config = await settings.findOne({ key: "support_whatsapp" });

  return config?.phoneNumber ?? "";
}

export async function setSupportWhatsappNumber(phoneNumber: string) {
  const normalized = normalizeWhatsappNumber(phoneNumber);

  if (!isValidWhatsappNumber(normalized)) {
    throw new Error("Enter a valid WhatsApp number with country code.");
  }

  const database = await getMongoDatabase();
  const settings = database.collection<SupportWhatsappDocument>("settings");

  await settings.updateOne(
    { key: "support_whatsapp" },
    {
      $set: {
        key: "support_whatsapp",
        phoneNumber: normalized,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return normalized;
}

export function buildWhatsappUrl(phoneNumber: string, message?: string) {
  const normalized = normalizeWhatsappNumber(phoneNumber);
  const text = encodeURIComponent(
    message ?? "Hello, I need customer support from Rivochain.",
  );

  return `https://wa.me/${normalized}?text=${text}`;
}
