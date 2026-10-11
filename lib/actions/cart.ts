"use server";

import { revalidatePath } from "next/cache";
import { addToCart, ensureCartToken, removeCartItem, updateCartItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import { readCartToken } from "@/lib/cart";

export type ActionResult = { ok: boolean; message: string };

export async function addToBagAction(variantId: string, quantity = 1): Promise<ActionResult> {
  try {
    const token = await ensureCartToken();
    await addToCart(token, variantId, quantity);
    await trackEvent({
      type: "ADD_TO_CART",
      sessionId: token,
      metadata: { variantId, quantity },
    });
    revalidatePath("/cart");
    revalidatePath("/");
    return { ok: true, message: "Added to bag" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not add to bag" };
  }
}

export async function updateBagItemAction(itemId: string, quantity: number): Promise<ActionResult> {
  try {
    const token = await readCartToken();
    if (!token) return { ok: false, message: "Bag not found" };
    await updateCartItem(token, itemId, quantity);
    revalidatePath("/cart");
    return { ok: true, message: "Updated" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update" };
  }
}

export async function removeBagItemAction(itemId: string): Promise<ActionResult> {
  try {
    const token = await readCartToken();
    if (!token) return { ok: false, message: "Bag not found" };
    await removeCartItem(token, itemId);
    revalidatePath("/cart");
    return { ok: true, message: "Removed" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not remove" };
  }
}
