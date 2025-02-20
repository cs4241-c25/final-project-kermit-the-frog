import { getServerSession } from "next-auth";
import { NextAuth } from "../auth/[...nextauth]/route";

export async function GET(req) {
  const session = await getServerSession(NextAuth);

  console.log("Session:", session);
  console.log("Authenticated:", !!session);

  return Response.json({ session, authenticated: !!session });
}
