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
        usersCollection = db.collection("user");
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
app.post("/api/doctors", async (req: Request, res: Response) => {
    try {
        const doctor = req.body;

        const doctorResult = await doctorsCollection.insertOne({
            ...doctor,
            status: "pending",
            createdAt: new Date()
        });

        res.send({ success: true, doctorResult });
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
});




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
    } catch (error: any) {
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
    } catch (error: any) {
        res.status(500).json({ error });
    }
});






// ---------- USER DASHBOARD ----------

// Get all appointments with doctor details for a specific user

app.get("/api/my-appointments/:userId", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        const result = await appointmentsCollection.aggregate([
            {
                $match: { patientId: userId }
            },
            {
                // 🔥 string → ObjectId convert
                $addFields: {
                    doctorObjectId: { $toObjectId: "$doctorId" }
                }
            },
            {
                $lookup: {
                    from: "doctor",
                    localField: "doctorObjectId",
                    foreignField: "_id",
                    as: "doctorDetails"
                }
            },
            {
                $unwind: {
                    path: "$doctorDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]).toArray();

        res.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



// ---------- DOCTOR DASHBOARD ----------

// doctor profile 
app.get("/api/doctors/by-user/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const doctor = await doctorsCollection.findOne({ userId });

        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor profile not found" });
        }

        res.json({ success: true, data: doctor });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


app.get("/api/doctor-appointments/:doctorId", async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.params;

        const result = await appointmentsCollection.aggregate([
            {
                $match: { doctorId }
            },
            {
                $addFields: {
                    patientObjectId: { $toObjectId: "$patientId" }
                }
            },
            {
                $lookup: {
                    from: "user",
                    localField: "patientObjectId",
                    foreignField: "_id",
                    as: "patientDetails"
                }
            },
            {
                $unwind: {
                    path: "$patientDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]).toArray();

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// appointment status update (approve / reject / complete)
app.patch("/api/appointments/:id/status", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["approved", "rejected", "completed", "pending"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const result = await appointmentsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } }
        );

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});



// ---------- DOCTOR ANALYTICS ----------

app.get("/api/doctor-stats/:doctorId", async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.params;

        // doctor review
        const doctor = await doctorsCollection.findOne({ _id: new ObjectId(doctorId) });
        const fee = Number(doctor?.consultationFee) || 0;

        // ১. Status breakdown (pending/approved/completed/rejected)
        const statusAgg = await appointmentsCollection.aggregate([
            { $match: { doctorId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();

        const statusCounts = { pending: 0, approved: 0, completed: 0, rejected: 0 };
        statusAgg.forEach((s: any) => {
            if (statusCounts.hasOwnProperty(s._id)) {
                statusCounts[s._id as keyof typeof statusCounts] = s.count;
            }
        });

        const totalAppointments = Object.values(statusCounts).reduce((a, b) => a + b, 0);

        // latest 14 days in
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        const trendAgg = await appointmentsCollection.aggregate([
            { $match: { doctorId, createdAt: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        // all 14 days fill
        const trendMap = new Map(trendAgg.map((t: any) => [t._id, t.count]));
        const appointmentsOverTime = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date(fourteenDaysAgo);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split("T")[0];
            appointmentsOverTime.push({
                date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                count: trendMap.get(key) || 0
            });
        }

        // ৩. Review/rating summary
        const reviews = await reviewsCollection.find({ doctorId }).toArray();
        const totalReviews = reviews.length;
        const avgRating = totalReviews
            ? Number((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1))
            : 0;

        const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
            star: `${star}★`,
            count: reviews.filter((r: any) => r.rating === star).length
        }));

        // ৪. Bookmark count
        const bookmarkCount = await bookmarksCollection.countDocuments({ doctorId });

        // ৫. Revenue estimate (completed appointment × fee)
        const revenueEstimate = statusCounts.completed * fee;

        res.json({
            success: true,
            data: {
                totalAppointments,
                statusCounts,
                appointmentsOverTime,
                avgRating,
                totalReviews,
                ratingDistribution,
                bookmarkCount,
                revenueEstimate,
                consultationFee: fee,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});






// doctor profile update (for doctor me  edit)

app.patch("/api/doctors/update/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            specialization,
            degree,
            description,
            image,
            consultationFee,
            workingDays,
            startTime,
            endTime,
            maxAppointments,
            consultationType,
        } = req.body;

        const updateFields: Record<string, any> = {
            name,
            specialization,
            degree,
            description,
            image,
            consultationFee,
            workingDays,
            startTime,
            endTime,
            maxAppointments,
            consultationType,
            updatedAt: new Date(),
        };

        // undefined 
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key] === undefined) delete updateFields[key];
        });

        // ১. doctor collection update
        const result = await doctorsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        
        const doctorDoc = await doctorsCollection.findOne({ _id: new ObjectId(id) });
        if (doctorDoc?.userId) {
            const userUpdateFields: Record<string, any> = {};
            if (name !== undefined) userUpdateFields.name = name;
            if (image !== undefined) userUpdateFields.image = image;

            if (Object.keys(userUpdateFields).length > 0) {
                await usersCollection.updateOne(
                    { _id: new ObjectId(doctorDoc.userId) },
                    { $set: userUpdateFields }
                );
            }
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});



// ---------- ADMIN: PATIENT MANAGEMENT ----------

// all patient in appoinmet added
app.get("/api/patients", async (req: Request, res: Response) => {
    try {
        const result = await usersCollection.aggregate([
            { $match: { role: "patient" } },
            {
                $lookup: {
                    from: "appointments",
                    let: { uid: { $toString: "$_id" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$patientId", "$$uid"] } } }
                    ],
                    as: "appointments"
                }
            },
            {
                $addFields: {
                    appointmentCount: { $size: "$appointments" }
                }
            },
            {
                $project: {
                    appointments: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// specific appointmest history
app.get("/api/patients/:id/appointments", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await appointmentsCollection.aggregate([
            { $match: { patientId: id } },
            {
                $addFields: {
                    doctorObjectId: { $toObjectId: "$doctorId" }
                }
            },
            {
                $lookup: {
                    from: "doctor",
                    localField: "doctorObjectId",
                    foreignField: "_id",
                    as: "doctorDetails"
                }
            },
            {
                $unwind: {
                    path: "$doctorDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Patient ban / unban toggle
app.patch("/api/patients/:id/ban", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { banned } = req.body;

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { banned: !!banned } }
        );

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});





// server listen
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});