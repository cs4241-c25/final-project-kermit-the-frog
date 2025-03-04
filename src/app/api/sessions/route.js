import {sessionCollection} from "@/lib/db";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
    try {
        /* Gets the Session given a parameter in request url */
        const {searchParams} = new URL(req.url)
        const sessionName = searchParams.get("sessionName");
        const getAllSessions = searchParams.get("getAllSessions");
        console.log('Received sessionName:', sessionName); // Log to check the value

        // Fetch the session
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response(JSON.stringify({error: "User not authenticated"}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }
        let findSession;

        /* If getAllSessions Parameter is present */
        if (getAllSessions) {
            //if you want all of them
            findSession = await sessionCollection.find(
                {userID: session.user.id}
            ).toArray();
            return new Response(JSON.stringify({sessionResults: "Session found", session: findSession}), {
                status: 200,
                headers: {"Content-Type": "application/json"},
            });
        }
        /* If sessionName Parameter is present */
        if (sessionName) {
            //only a specific session
            findSession = await sessionCollection.findOne(
                {userID: session.user.id, sessionName: sessionName}
            );

            // If session is not found
            if (!findSession) {
                console.log("Session does not exist, continue with creation");
                return new Response(JSON.stringify({sessionResults: "Session not found"}), {
                    status: 404,
                    headers: {"Content-Type": "application/json"},
                });
            } else {
                // If session is found
                return new Response(JSON.stringify({sessionResults: "Session found", session: findSession}), {
                    status: 200,
                    headers: {"Content-Type": "application/json"},
                });
            }
        }
        return new Response(JSON.stringify({error: "Invalid Parameters"}), {
            status: 400,
            headers: {"Content-Type": "application/json"},
        });

    } catch (error) {
        console.error('Error:', error);  // Log the error for debugging
        return new Response(JSON.stringify({message: error.message}), {
            status: 500,
            headers: {"Content-Type": "application/json"},
        });
    }
}

export async function POST(req) {
    const {sessionName, isThreeByThree} = await req.json()
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response(JSON.stringify({error: "User not authenticated"}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }
        const findSession = await sessionCollection.findOne(
            {userID: session.user.id, sessionName: sessionName}
        )

        if (!findSession) {
            console.log("Session Does not exist, continue with creation")
            const createSession = await sessionCollection.insertOne(
                {userID: session.user.id, sessionName: sessionName, isThreeByThree: isThreeByThree, timerData: []}
            )
            return new Response(JSON.stringify({createSession: createSession.acknowledged}), {
                status: 200,
                headers: {"Content-Type": "application/json"},
            });
        }

        if (findSession) {
            return new Response(JSON.stringify({message: "Session already exists"}), {
                status: 200,
                headers: {"Content-Type": "application/json"},
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({message: error.message}), {
            status: 500,
            headers: {"Content-Type": "application/json"},
        });
    }
}
