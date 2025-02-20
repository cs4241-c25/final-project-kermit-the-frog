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


const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          await connectDB();
          const db = client.db("a4database");
          const userCollection = db.collection("users");
          const user = await userCollection.findOne({ email: credentials.email });

          if (!user) {
            console.log("User not found");
            return null;
          }

          if (user.password !== credentials.password) {
            console.log("Incorrect password");
            return null;
          }

          return { id: user._id.toString(), email: user.email };
        } catch (err) {
          console.error("Authorization error:", err);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/Iogin",
  },
  session: {
    strategy: "jwt",
  }
})

export { handler as GET, handler as POST}