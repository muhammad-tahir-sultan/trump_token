import { getMongoDatabase } from "@/features/auth/services/mongodb-client";

type SupportWhatsappDocument = {
  key: "support_whatsapp";
  phoneNumber: string;
  enabled: boolean;
  updatedAt: Date;
};

export type SupportWhatsappSettings = {
  phoneNumber: string;
  enabled: boolean;
};

export function normalizeWhatsappNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidWhatsappNumber(value: string) {
  const normalized = normalizeWhatsappNumber(value);
  return normalized.length >= 8 && normalized.length <= 15;
}

export async function getSupportWhatsappSettings(): Promise<SupportWhatsappSettings> {
  const database = await getMongoDatabase();
  const settings = database.collection<SupportWhatsappDocument>("settings");
  const config = await settings.findOne({ key: "support_whatsapp" });

  return {
    phoneNumber: config?.phoneNumber ?? "",
    enabled: config?.enabled ?? false,
  };
}

export async function getSupportWhatsappNumber() {
  const settings = await getSupportWhatsappSettings();
  return settings.phoneNumber;
}

export async function updateSupportWhatsappSettings(partial: {
  phoneNumber?: string;
  enabled?: boolean;
}): Promise<SupportWhatsappSettings> {
  const database = await getMongoDatabase();
  const settings = database.collection<SupportWhatsappDocument>("settings");
  const existing = await settings.findOne({ key: "support_whatsapp" });

  let phoneNumber = existing?.phoneNumber ?? "";
  let enabled = existing?.enabled ?? false;

  if (partial.phoneNumber !== undefined) {
    const normalized = normalizeWhatsappNumber(partial.phoneNumber);

    if (!isValidWhatsappNumber(normalized)) {
      throw new Error("Enter a valid WhatsApp number with country code.");
    }

    phoneNumber = normalized;
  }

  if (partial.enabled !== undefined) {
    enabled = partial.enabled;
  }

  if (enabled && !isValidWhatsappNumber(phoneNumber)) {
    throw new Error("Add a valid WhatsApp number before enabling the button.");
  }

  await settings.updateOne(
    { key: "support_whatsapp" },
    {
      $set: {
        key: "support_whatsapp",
        phoneNumber,
        enabled,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { phoneNumber, enabled };
}

export async function setSupportWhatsappNumber(phoneNumber: string) {
  const result = await updateSupportWhatsappSettings({ phoneNumber });
  return result.phoneNumber;
}

export function buildWhatsappUrl(phoneNumber: string, message?: string) {
  const normalized = normalizeWhatsappNumber(phoneNumber);
  const text = encodeURIComponent(
    message ?? "Hello, I need customer support from Rivochain.",
  );

  return `https://wa.me/${normalized}?text=${text}`;
}
