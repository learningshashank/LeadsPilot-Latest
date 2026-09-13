import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Real Razorpay wallet top-up flow.
 *
 * DATA HONESTY RULE: credits are only ever added to credits_ledger after a
 * REAL Razorpay payment signature has been verified server-side against a
 * REAL order looked up from Razorpay's own API — never from a client-supplied
 * amount, and never as a simulated/placeholder success.
 *
 * 1 credit = ₹1. Amounts are entered and shown in INR throughout the UI.
 */

async function orgIdFor(supabase: any, userId: string) {
  const { data, error } = await supabase.from("users").select("org_id").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.org_id) throw new Error("No organization for this user.");
  return data.org_id as string;
}

function razorpayAuthHeader() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) return null;
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export const getRazorpayKeyId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Only the public Key ID goes to the client — Checkout.js needs it to
    // open the payment modal. RAZORPAY_KEY_SECRET never leaves the server.
    return { keyId: process.env["RAZORPAY_KEY_ID"] ?? null };
  });

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        amountInr: z.number().int().min(1000, "Minimum top-up is ₹1,000"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const auth = razorpayAuthHeader();
    if (!auth) {
      throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured. Add them in Settings → API keys.");
    }

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        amount: data.amountInr * 100, // Razorpay expects the amount in paise
        currency: "INR",
        notes: { purpose: "leadspilot_wallet_topup" },
      }),
    });
    const order: any = await res.json();

    if (!res.ok) {
      throw new Error(order?.error?.description || `Razorpay order creation failed (${res.status})`);
    }

    return { orderId: order.id as string, amount: order.amount as number, currency: order.currency as string };
  });

export const verifyAndCreditPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET is not configured.");

    // Verify the payment signature ourselves — never trust the client's
    // word that a payment succeeded.
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      throw new Error("Payment signature verification failed. This payment was not credited.");
    }

    // Fetch the authoritative order amount from Razorpay's own API rather
    // than trusting any amount the client might have sent.
    const auth = razorpayAuthHeader();
    if (!auth) throw new Error("Razorpay credentials are not configured.");
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${data.razorpay_order_id}`, {
      headers: { Authorization: auth },
    });
    const order: any = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(order?.error?.description || "Could not verify order with Razorpay.");
    }
    if (order.status !== "paid") {
      throw new Error(`Order status is "${order.status}", not "paid" — payment not credited.`);
    }

    const creditAmount = Math.round(order.amount / 100); // paise → ₹ → credits (1 credit = ₹1)
    const orgId = await orgIdFor(context.supabase, context.userId);

    const { data: last } = await context.supabase
      .from("credits_ledger")
      .select("balance_after")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1);
    const previousBalance = last?.[0]?.balance_after != null ? Number(last[0].balance_after) : 0;
    const newBalance = previousBalance + creditAmount;

    const { error: insertErr } = await context.supabase.from("credits_ledger").insert({
      org_id: orgId,
      amount: creditAmount,
      reason: "razorpay_topup",
      api_call_ref: data.razorpay_payment_id,
      balance_after: newBalance,
    });
    if (insertErr) throw new Error(insertErr.message);

    return { creditedAmount: creditAmount, newBalance };
  });
