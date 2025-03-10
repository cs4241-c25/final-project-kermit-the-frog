import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import {saveEmailToDB} from "@/app/api/register/route";
import {userCollection} from "@/lib/db";
import NextAuth from "next-auth";

export const authOptions = {
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
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    //When the signIn function is used with any auth routes, it calls a function to check if registered
    async jwt( { token, account, profile, user } ) {
      if (account && profile) {
          token.email = profile.email;
          const result = await saveEmailToDB(profile.email);
          if (result.success) {
              token.id = result._id;
          } else {
              console.log("Error adding userID to sessions")
          }
      }
      if(user){
          if(account.provider === "credentials") {
              if(user.id) {
                  token.id = user.id
              }
          }
      }

      return token
  },
      async session({ session,token }) {
        session.user.email = token.email;
        if(token.id) {
          session.user.id = token.id;
        }
        console.log(session);
        return session;
      }
  }
}
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST}