import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, Db, Collection, ObjectId } from 'mongodb';
import Stripe from 'stripe';

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
let usersCollection: Collection;
let reviewsCollection: Collection;
let bookmarksCollection: Collection;
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
        usersCollection = db.collection("users");
        reviewsCollection = db.collection("reviews");
        bookmarksCollection = db.collection("bookmarks");

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
            { _id: new ObjectId(id) },
            { $set: { status: "approved" } }
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




// Get single doctor by id: view details er jonou

app.get("/api/doctors/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await doctorsCollection.findOne(query);
    res.send(result);
})





// ---------- REVIEWS ----------

// Add a review

app.post("/api/reviews", async (req, res) => {
    try {
        const review = req.body;
        const result = await reviewsCollection.insertOne(review);
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
})


// // Get all reviews for a specific doctor

app.get("/api/reviews/:doctorId", async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const result = await reviewsCollection.find({ doctorId }).sort({ createdAt: -1 }).toArray();
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
})










// ---------- BOOKMARKS ----------

// Add a bookmark


app.post("/api/bookmarks", async (req, res) => {
    try {
        const bookmark = req.body;

        const exists = await bookmarksCollection.findOne({
            doctorId: bookmark.doctorId,
            userEmail: bookmark.userEmail,
        });

        if (exists) {
            return res.status(409).send({ success: false, message: "Already bookmarked" });
        }

        bookmark.createdAt = new Date();
        const result = await bookmarksCollection.insertOne(bookmark);
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
})


// Get all bookmarks for a user
app.get("/api/bookmarks/:userEmail", async (req, res) => {
    try {
        const userEmail = req.params.userEmail;
        const result = await bookmarksCollection.find({ userEmail }).toArray();
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// Remove a bookmark
app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await bookmarksCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
});









//             stripe A 2 Z



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-06-20" as any,
});



app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;

         if (!amount || isNaN(amount)) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // cents
            currency: "usd",
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error:any) {
        res.status(500).json({ error });
    }
});






// appoinment

app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
        const appointment = {
            ...req.body,
            status: "pending",
            createdAt: new Date(),
        };

        const result = await appointmentsCollection.insertOne(appointment);

        res.json({
            success: true,
            data: result,
        });
    } catch (error:any) {
        res.status(500).json({ error });
    }
});



// server listen
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});