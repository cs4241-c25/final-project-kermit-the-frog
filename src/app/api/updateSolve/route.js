import {ObjectId} from "mongodb";

console.log("data route running");

import { getServerSession } from "next-auth"
import { solveCollection} from "@/lib/db";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  const { id, status } = await req.json();

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("going to delete solve:");
    console.log(id);

    const result = await solveCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );

    if(result.modifiedCount  === 1){
      return new Response(JSON.stringify({ success: true, message: "Solve Update successful" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
    else {
      return new Response(JSON.stringify({ success: false, message: "Solve not found" }), {
        status: 501,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}