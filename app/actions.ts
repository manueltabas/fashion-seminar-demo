"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/auth/config";

export async function signOut() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/login");
}
