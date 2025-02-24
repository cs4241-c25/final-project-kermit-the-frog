import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth"
import {userCollection} from "@/lib/db";

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
    signIn: "/auth/Iogin",
  },
  session: {
    strategy: "jwt",
  }
})

export { handler as GET, handler as POST}