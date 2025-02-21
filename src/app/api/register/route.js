import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth"
import {userCollection} from "@/lib/DatabaseConnectionUtils";

export async function POST(req) {
  console.log("setting email and password to below:");
  const { email, password } = await req.json();
  console.log(email);
  console.log(password);
  console.log("setting email and password to above - Connecting to DB");

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