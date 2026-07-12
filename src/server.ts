import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Db, Collection, ObjectId } from 'mongodb';

// env configuration
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb client
const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("❌ Error: MONGO_URI is not defined in .env file!");
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


let db: Db;
let doctorsCollection: Collection;
let appointmentsCollection: Collection;

// db connection function
async function connectDB() {
    try {
        await client.connect();
        console.log("🏥 CarePulse Database Successfully Connected to MongoDB Atlas! 🎉");

        // global varible a asinged 
        db = client.db("hospital-management");
        doctorsCollection = db.collection("doctor");
        appointmentsCollection = db.collection("appointments");

    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
}
connectDB();

// basic route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'CarePulse Backend Setup is Ready! 🚀',
    });
});





// post doctor
app.post("/api/doctors", async (req, res) => {
    try {
        const doctor = req.body;
        const result = await doctorsCollection.insertOne(doctor);
        res.send(result)
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message })
    }
})




// get all doctor
app.get('/api/doctors', async (req, res) => {
    try {
        const result = await doctorsCollection.find().toArray();
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
});





// doctor approve

app.patch("/api/doctors/approve/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await doctorsCollection.updateOne(
            {_id:new ObjectId(id)},
            {$set:{status:"approved"}}
        )
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message })
    }
})





// doctor delete

app.delete("/api/doctors/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await doctorsCollection.deleteOne(query);
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message })
    }

})

// server listen
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});