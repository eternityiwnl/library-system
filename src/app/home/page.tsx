import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/session";

// Нэвтэрсний дараах чиглүүлэгч: эрхээс хамаарч өөр хуудас руу
export default async function HomeRedirect() {
  const user = await requireUser();
  redirect(homeFor(user.role));
}
