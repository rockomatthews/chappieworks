import { list } from "@vercel/blob";
import { WallVideo, WallImage } from "./MediaWallClient";

// The homepage wall: every movie and picture the studio has rendered, pulled
// straight from blob storage, newest first — plus the curated reel clips as a
// permanent backbone so the wall never looks thin. Server component; the
// listing revalidates with the page (see app/page.tsx revalidate).

const MAX_VIDEOS = 12;
const MAX_IMAGES = 12;

// Curated /movie reel (public/movie-reel/*.mp4) — always present.
const REEL = [1, 2, 3, 4, 5, 7, 8, 9, 10].map((n) => ({
  kind: "video" as const,
  src: `/movie-reel/${n}.mp4`,
  at: 0, // curated items sort after fresh customer work
}));

type WallItem =
  | { kind: "video"; src: string; at: number }
  | { kind: "image"; src: string; at: number };

async function collect(): Promise<WallItem[]> {
  const items: WallItem[] = [...REEL];
  try {
    const [movies, shoots] = await Promise.all([
      list({ prefix: "movies/", limit: 1000 }),
      list({ prefix: "photoshoots/", limit: 1000 }),
    ]);
    for (const b of movies.blobs) {
      if (!b.pathname.endsWith("/clean.mp4")) continue;
      items.push({
        kind: "video",
        src: b.url,
        at: new Date(b.uploadedAt).getTime(),
      });
    }
    // Generated brand images only — never the customer's uploaded raw assets
    // (asset-*) or state files.
    for (const b of shoots.blobs) {
      if (!/\/[a-z-]+\.png$/.test(b.pathname)) continue;
      if (b.pathname.includes("/asset-")) continue;
      items.push({
        kind: "image",
        src: b.url,
        at: new Date(b.uploadedAt).getTime(),
      });
    }
  } catch (err) {
    // Wall degrades to the curated reel if blob listing hiccups.
    console.error(
      "[chappieworks:wall] blob list failed",
      err instanceof Error ? err.message : err,
    );
  }

  const videos = items
    .filter((i) => i.kind === "video")
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_VIDEOS);
  const images = items
    .filter((i) => i.kind === "image")
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_IMAGES);

  // Interleave video/image so the grid reads as a mixed wall, not two bands.
  const wall: WallItem[] = [];
  const longest = Math.max(videos.length, images.length);
  for (let i = 0; i < longest; i++) {
    if (videos[i]) wall.push(videos[i]);
    if (images[i]) wall.push(images[i]);
  }
  return wall;
}

export async function MediaWall() {
  const wall = await collect();
  if (wall.length === 0) return null;

  return (
    <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
      {wall.map((item, i) =>
        item.kind === "video" ? (
          <WallVideo key={item.src} src={item.src} eager={i < 4} />
        ) : (
          <WallImage key={item.src} src={item.src} />
        ),
      )}
    </div>
  );
}
