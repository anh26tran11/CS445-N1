import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MONGODB_URL) {
    throw new Error(
        "Vui lòng cung cấp MONGODB_URL trong tệp .env"
    )
}

const getFallbackUri = (srvUri) => {
    if (srvUri.includes("mongodb+srv://") && srvUri.includes("cluster0.ipthm6l.mongodb.net")) {
        const authPart = srvUri.split("mongodb+srv://")[1].split("@")[0];
        const dbPart = srvUri.split("/")[3]?.split("?")[0] || "RestoHub";
        return `mongodb://${authPart}@ac-pxbhq9v-shard-00-00.ipthm6l.mongodb.net:27017,ac-pxbhq9v-shard-00-01.ipthm6l.mongodb.net:27017,ac-pxbhq9v-shard-00-02.ipthm6l.mongodb.net:27017/${dbPart}?ssl=true&replicaSet=atlas-a0rm7d-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
    return srvUri;
};

async function connectDB() {
    try {
        try {
            await mongoose.connect(process.env.MONGODB_URL);
        } catch (connErr) {
            console.warn("⚠️ MONGODB_URL connection failed:", connErr.message);
            console.log("Trying fallback connection string...");
            const fallbackUri = getFallbackUri(process.env.MONGODB_URL);
            if (fallbackUri !== process.env.MONGODB_URL) {
                console.log("Attempting fallback URI connection...");
                await mongoose.connect(fallbackUri);
            } else {
                throw connErr;
            }
        }
    } catch (error) {
        console.log("MongoDB connect error", error)
        process.exit(1);
    }
}

export default connectDB