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

    if(result.updatedCount === 1){
      return new Response(JSON.stringify({ success: true, message: "Solve removal successful" }), {
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