import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  SEA_LIVE_ALLOWED_HOST,
  SEA_LIVE_ALLOWED_PORT,
} from "@/lib/seaLive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAllowedStreamUrl(url: URL) {
  return (
    url.protocol === "http:" &&
    url.hostname === SEA_LIVE_ALLOWED_HOST &&
    url.port === SEA_LIVE_ALLOWED_PORT &&
    url.pathname.startsWith("/live/1-76.stream/")
  );
}

function getContentType(url: URL, upstreamContentType: string | null) {
  if (url.pathname.endsWith(".m3u8")) {
    return "application/vnd.apple.mpegurl";
  }

  if (url.pathname.endsWith(".ts")) {
    return "video/mp2t";
  }

  return upstreamContentType || "application/octet-stream";
}

function rewritePlaylist(body: string, sourceUrl: URL) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      const nextUrl = new URL(trimmed, sourceUrl);

      if (!isAllowedStreamUrl(nextUrl)) {
        return line;
      }

      return `/api/sea-live/proxy?url=${encodeURIComponent(
        nextUrl.toString(),
      )}`;
    })
    .join("\n");
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Stream URL is required.",
      },
      {
        status: 400,
      },
    );
  }

  let sourceUrl: URL;

  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid stream URL.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isAllowedStreamUrl(sourceUrl)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Stream URL is not allowed.",
      },
      {
        status: 403,
      },
    );
  }

  const upstreamResponse = await fetch(sourceUrl, {
    cache: "no-store",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json(
      {
        ok: false,
        message: "Live stream is temporarily unavailable.",
      },
      {
        status: 502,
      },
    );
  }

  const contentType = getContentType(
    sourceUrl,
    upstreamResponse.headers.get("content-type"),
  );

  if (sourceUrl.pathname.endsWith(".m3u8")) {
    const body = await upstreamResponse.text();

    return new NextResponse(rewritePlaylist(body, sourceUrl), {
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  }

  return new NextResponse(upstreamResponse.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
