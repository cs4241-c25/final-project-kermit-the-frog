import {ObjectId} from "mongodb";
import {getServerSession} from "next-auth"
import {solveCollection, userCollection, sessionCollection} from "@/lib/db";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import { v4 as uuidv4 } from 'uuid';

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
  const { time, timestamp, sessionName, scramble } = await req.json();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = session.user.email;
    let userID = await getUserIDByEmail(email);
    /* with userID and sessions name find sessions row, use the $push to push this information into the array of objects in mongoDB */

    userID = userID.toString();
    const solveID = uuidv4().replace(/-/g, '');


    console.log("Looking for something with userID: ", userID);
    console.log("Looking for something with sessionName: ", sessionName);
    
    await sessionCollection.updateOne(
      { userID: userID, sessionName: sessionName }, // Find document with matching userID and sessionname
      { 
          $push: { 
              timerData: { 
                  solveID,
                  time,
                  timestamp,
                  status: "OK",
                  scramble
              } 
          }
      }
  );

    return new Response(JSON.stringify({ success: true, message: "Solve added successful" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(req, res) {
  try {
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
    console.log("session.user.id: ", session.user.id);
    console.log(session.user.email);
    let user = await getUserByEmail(session.user.email);


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