import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth"
import {userCollection} from "@/lib/DatabaseConnectionUtils";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import {saveEmailToDB} from "@/app/api/register/route";

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
    }),
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    //When the signIn function is used with any auth routes, it calls a function to check if registered
      async jwt({ token, account, profile }) {

          if (account && profile) {
              token.email = profile.email;
              await saveEmailToDB(profile.email);
          }
          return token
      },
      async session({ session,token }) {
        session.email = token.email;
        return session;
      }
  }
})

export { handler as GET, handler as POST}