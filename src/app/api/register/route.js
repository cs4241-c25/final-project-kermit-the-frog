import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth"

const {MongoClient, ObjectId} = require("mongodb");
const mongoURI = "mongodb+srv://yoyo17233:databasepassword@a3db.nouer.mongodb.net/?retryWrites=true&w=majority&ssl=true&appName=a3db";
const client = new MongoClient(mongoURI);

async function connectDB() {
  try {
      await client.connect();
      console.log("Connected to MongoDB ✅");
      // await solveCollection.deleteMany({}); UNCOMMENTING THIS LINE WILL DELETE ALL SOLVES IN THE DB
  }   
  catch (err) {
      console.error("MongoDB Connection Error:", err);
  }
}

export async function POST(req) {
  console.log("setting email and password to below:");
  const { email, password } = await req.json();
  console.log(email);
  console.log(password);
  console.log("setting email and password to above - Connecting to DB");
  await connectDB();
  console.log("CONNECTED");
  const db = client.db("a4database");
  console.log("DATABASE SET");
  const userCollection = db.collection("users");
  console.log("Collection Found");

  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, message: "Email is already registered" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    await userCollection.insertOne({ email, password });
    return new Response(JSON.stringify({ success: true, message: "Registration successful" }), {
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