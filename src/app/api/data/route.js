console.log("data route running");

import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth"
import { authOptions } from "next-auth/providers/credentials";
import { getServerSession } from "next-auth"

const {MongoClient, ObjectId} = require("mongodb");
const mongoURI = "mongodb+srv://yoyo17233:databasepassword@a3db.nouer.mongodb.net/?retryWrites=true&w=majority&ssl=true&appName=a3db";
const client = new MongoClient(mongoURI);
var userCollection;
var solveCollection;

async function connectDB() {
  try {
      await client.connect();
      console.log("Connected to MongoDB ✅");
      const db = client.db("a4database");
      userCollection = db.collection("users");
      solveCollection = db.collection("solves");
      //await solveCollection.deleteMany({}); //UNCOMMENTING THIS LINE WILL DELETE ALL SOLVES IN THE DB
  }   
  catch (err) {
      console.error("MongoDB Connection Error:", err);
  }
}

await connectDB();

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
    const user = await userCollection.findOne({ email });

    return user;

  } catch (err) {
    console.error("Error fetching user:", err);
    throw new Error("Error fetching user from the database");
  }
}

export async function POST(req) {
  console.log("setting time and timestamp to below:");
  const { time, timestamp } = await req.json();
  console.log(time); 
  console.log(timestamp);
  console.log("setting time and timestamp to above");

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = session.user.email;
    var userID = await getUserIDByEmail(email);
    await solveCollection.insertOne({ userID, time, timestamp, status: "OK" });
    return new Response(JSON.stringify({ success: true, message: "Solve addded successful" }), {
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

    connectDB();
    console.log("CONNECTED");
    const db = client.db("a4database");
    console.log("DATABASE SET");
    const solveCollection = db.collection("solves");

    console.log("DB CONNECTED");
    console.log("session.user.id:");
    console.log(session.user.email);
    var user = await getUserByEmail(session.user.email);
    console.log(user);

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