import {ObjectId, ReturnDocument} from "mongodb";

console.log("data route running");

import { getServerSession } from "next-auth"
import { solveCollection, sessionCollection} from "@/lib/db";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  const { id, status, sessionName } = await req.json();

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }             

    console.log("going to update solve:", id);
    const userID = session.user.id;
    console.log(userID);
    console.log("Session name:", sessionName);

    const doc = await sessionCollection.findOne(
      { userID: userID, sessionName: sessionName }
    );
    console.log("document: ", doc);

    const result = await sessionCollection.updateOne(
      { userID: userID, sessionName: sessionName },
      { $set: { 'timerData.$[elem].status': status } },
      { arrayFilters: [{'elem.solveID': id}],
        ReturnDocument: 'after' }
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