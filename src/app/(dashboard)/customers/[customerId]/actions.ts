"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customerNoteSchema, addCustomerNote } from "@/server/services/customers";

export async function addCustomerNoteAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const parsed = customerNoteSchema.safeParse({
    body: String(formData.get("body") ?? ""),
    customerId,
  });

  if (!parsed.success) {
    redirect(`/customers/${encodeURIComponent(customerId)}?noteStatus=invalid`);
  }

  await addCustomerNote(parsed.data);
  revalidatePath(`/customers/${parsed.data.customerId}`);
  redirect(`/customers/${parsed.data.customerId}?noteStatus=added`);
}

