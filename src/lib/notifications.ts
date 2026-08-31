import "server-only";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function notify(args: {
  userId: string;
  type: "BOOKING" | "STATUS" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link ?? null,
    });
  } catch (err) {
    console.error("[notify] failed to create notification", err);
  }
}
