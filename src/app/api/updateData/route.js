import {ObjectId} from "mongodb";
import {getServerSession} from "next-auth"
import {solveCollection, userCollection} from "@/lib/db";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

console.log("data route running");

/* Moved Connection String to Lib/DatabaseConnectionUtils */

async function getUserIDByEmail(email) {
  try {
    // Find user by email
    const user = await userCollection.findOne({ email });

    // Return the user including the _id (which is the ObjectId)
    return user._id;

  } catch (err) {
    console.error("Error fetching user:", err);
    throw new Error("Error fetching user from the database");
  }
}

async function getUserByEmail(email) {
  try {
    return await userCollection.findOne({email});

  } catch (err) {
    console.error("Error fetching user:", err);
    throw new Error("Error fetching user from the database");
  }
}

export async function POST(req) {
  try {
    console.log(req);
    console.log("UPDATE AUTH CALLED");
    const session = await getServerSession(authOptions);
    console.log("SESSION GRABBED");
    console.log(session);
    if (!session) {
      console.log("SESSION NOT AUTHED");
      return new Response(JSON.stringify({ success: false, message: "NOTAUTHED" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("user authed in UPDATE");
    console.log(session.user.email);
    let user = await getUserByEmail(session.user.email);
    console.log("user ID=");
    console.log(user._id);
    console.log("sessionName=");
    console.log(req.sessionName);

    const userSession = await db.collection("sessions").findOne({
      userID: new ObjectId(user._id),
      sessionName: req.sessionName 
    });

    console.log("session found:");
    console.log(userSession);
    
    const solves = await solveCollection.find(
      { userID: new ObjectId(user._id)},
      { projection: { userID: 0 } }
    ).toArray();

    console.log("solves found:");
    console.log(solves);

    return new Response(JSON.stringify({ user: user, solves: solves }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {

    return new Response(JSON.stringify({ success: false, message: "DIFFERENTERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}