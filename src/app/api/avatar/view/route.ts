import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isSessionAdmin } from "@/lib/adminAuth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { getUserById } from "@/lib/repositories/userRepository";
import {
  isPrivateStoredAvatar,
  isSafeAvatarBlobPathname,
  PRIVATE_AVATAR_PREFIX,
} from "@/lib/blobAvatar";

/**
 * Streams a user's avatar: public URLs redirect; private blobs use `get()` with the RW token.
 */
export async function GET(request: Request) {
  const session = await getAuthSession();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedId = searchParams.get("userId")?.trim() || sessionUserId;

  if (requestedId !== sessionUserId && !(await isSessionAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const env = getCurrentEnvironment();
  const user = await getUserById(requestedId, env);
  const stored = user?.avatar_url;
  if (!stored) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isPrivateStoredAvatar(stored)) {
    if (stored.startsWith("http://") || stored.startsWith("https://")) {
      return NextResponse.redirect(stored, 307);
    }
    return new NextResponse("Not found", { status: 404 });
  }

  const pathname = stored.slice(PRIVATE_AVATAR_PREFIX.length);
  if (!isSafeAvatarBlobPathname(pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const token = process.env["BLOB_READ_WRITE_TOKEN"];
  if (!token) {
    return NextResponse.json(
      { error: "Blob token not configured" },
      { status: 503 },
    );
  }

  const result = await get(pathname, {
    access: "private",
    token,
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    },
  });
}
