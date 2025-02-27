import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Import authOptions

export async function GET(req) {
  const session = await getServerSession(authOptions, req);

  console.log("Session:", session);
  console.log("Authenticated:", !!session);

  return Response.json({ session, authenticated: !!session });
};