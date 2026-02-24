import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const rawHandle = request.nextUrl.searchParams.get("handle") ?? "";
  const handle = rawHandle.trim().toLowerCase().replace(/^@/, "");

  if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
    return NextResponse.json(
      { code: "INVALID_HANDLE" },
      { status: 400 },
    );
  }

  const supabase = createClient();

  // Check if this is the current user's own handle
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: ownProfile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();

    if (ownProfile?.handle === handle) {
      return NextResponse.json(
        { code: "CANNOT_ADD_SELF" },
        { status: 400 },
      );
    }
  }

  // Look up the target profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json(
      { code: "USER_NOT_FOUND" },
      { status: 404 },
    );
  }

  // Check if already following (informational)
  if (user) {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_user_id", user.id)
      .eq("following_user_id", profile.id);

    if (count && count > 0) {
      return NextResponse.json(
        { code: "ALREADY_FOLLOWING", handle: profile.handle },
        { status: 200 },
      );
    }
  }

  return NextResponse.json(
    { code: "OK", handle: profile.handle },
    { status: 200 },
  );
}
