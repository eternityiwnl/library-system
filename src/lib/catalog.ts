import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

export function listCategories() {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name));
}

/** LIKE-ийн тусгай тэмдэгтийг escape хийсэн '%хайлт%' загвар */
export function containsPattern(query: string) {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}
