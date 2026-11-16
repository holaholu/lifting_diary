import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  let evt;
  try {
    // Reads CLERK_WEBHOOK_SIGNING_SECRET automatically
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, primary_email_address_id } = evt.data;
    const email =
      email_addresses.find((e) => e.id === primary_email_address_id)
        ?.email_address ??
      email_addresses[0]?.email_address ??
      null;

    // Upsert keeps retries and out-of-order events idempotent
    await db
      .insert(users)
      .values({ id, email })
      .onConflictDoUpdate({ target: users.id, set: { email } });
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    // Cascades to the user's workouts and custom exercises
    await db.delete(users).where(eq(users.id, evt.data.id));
  }

  return new Response("OK", { status: 200 });
}
