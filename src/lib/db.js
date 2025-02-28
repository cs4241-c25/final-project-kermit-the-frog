import dotenv from "dotenv";

dotenv.config();

const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_HOST,
} = process.env;

/* May be changed for Mongoose Later */

const {MongoClient, ObjectId} = require("mongodb");
//Use .env for modularity and cache the client for only 1 connection
const mongoURI = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}/?retryWrites=true&w=majority&appName=a3db`
const client = new MongoClient(mongoURI);

let cachedClient = null;
let cachedDB = null;
let connectionCount = 0;

export let userCollection = null;
export let solveCollection = null;
export let sessionCollection = null;

/**
 *
 * Only Connect to DB once when the server starts and keep that connection open for reuse
 * Export Collections to allow for access
 *
 **/
export async function connectDB() {
    try {
        if (cachedDB) return cachedDB;
        cachedClient = await client.connect();
        cachedDB = client.db("a4database");
        /* Test Only one connection exists */
        connectionCount++
        console.log("Connected to MongoDB ✅ ", connectionCount);

        return cachedDB;
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
}

await connectDB();

/* All that is needed is one call to connect to the database, since it is kept open once called */
async function getCollections() {
    if (solveCollection === null || userCollection === null || sessionCollection === null) {
        const cachedDB = await connectDB();
        if (solveCollection === null) solveCollection = cachedDB.collection("solves");
        if (userCollection === null) userCollection = cachedDB.collection("users");
        if (sessionCollection === null) sessionCollection = cachedDB.collection("sessions");
    }
}

await getCollections();


