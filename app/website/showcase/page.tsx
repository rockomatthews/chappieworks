import { redirect } from "next/navigation";

// The showcase merged into the homepage (hero, 3D Chappie, media wall,
// modules). Keep the old URL alive for links in the wild.
export default function ShowcasePage() {
  redirect("/");
}
