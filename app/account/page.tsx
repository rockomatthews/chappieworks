import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /account moved into /studio (the seven-personas hub). This page is kept as
// a redirect so any pre-existing bookmarks or pasted links still land you in
// the right place.
export default function AccountRedirect() {
  redirect("/studio");
}
