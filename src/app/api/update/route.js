import { MongoClient, ObjectId } from "mongodb";
import { authOptions } from "next-auth/providers/credentials";
import { getServerSession } from "next-auth"
import { getSession } from "next-auth/react";

const mongoURI = "mongodb+srv://yoyo17233:databasepassword@a3db.nouer.mongodb.net/?retryWrites=true&w=majority&ssl=true&appName=a3db";
const client = new MongoClient(mongoURI);

async function connectDB() {
  await client.connect();
}

async function getUserIdByEmail(email) {
  try {
    console.log("connecting to DB in getUserID");
    connectDB();
    console.log("connexted to DB in getUserID");
    const db = client.db("a4database");
    console.log("set DB in getUserID");
    const userCollection = db.collection("users");
    console.log("collection set in getUserID");
    console.log(email);
    const user = await userCollection.findOne({ email: email });
    console.log("found user");
    console.log(user);
    
    return user._id;

  } catch (err) {
    console.error("Error fetching user:", err);
  }
}

export async function POST(req, res) {
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

    connectDB();
    console.log("CONNECTED");
    const db = client.db("a4database");
    console.log("DATABASE SET");
    const solveCollection = db.collection("solves");

    console.log("DB CONNECTED");
    console.log("session.user.id:");
    console.log(session.user.email);
    var userId = await getUserIdByEmail(session.user.email);
    console.log(userId.toString());

    const solves = await solveCollection.find(
      { userID: userId },
      { projection: { userID: 0 } }
    ).toArray();
    console.log("solves found:");
    console.log(solves);

    return new Response(JSON.stringify({ success: true, solves: solves }), {
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