const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5003

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://servejoy-2981d.web.app',
        'https://servejoy-2981d.firebaseapp.com'
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

// Midlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


// My midlewares
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorize access' })
    }
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(401).send({ message: 'unauthorize access' })
            }
            console.log('from my midleware:', decoded);
            req.user = decoded
            next()
        })
    }

}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nymxsdl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const needVolunteerCollection = client.db('servejoyDB').collection('needVolunteer')
        const requestCollection = client.db('servejoyDB').collection('beAVolunteer')

        // Generate jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d' })
            console.log('User token ===>', user);
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
                })
                .send({ success: true })
        })

        // Clear token from cookies on logout
        app.get('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', maxAge: 0
                })
                .send({ success: true })
        })


        app.get('/needvolunteers', async (req, res) => {
            const { sort, limit, search } = req.query;
            let sortOption = {};
            let limitOption = parseInt(limit) || 0; // Default to 0, which means no limit

            if (sort === 'ascending') {
                sortOption = { deadline: 1 }; // ascending by deadline
            } else if (sort === 'descending') {
                sortOption = { deadline: -1 }; // descending by deadline
            }

            // Initialize the query object
            let query = {};

            // If a search term is provided, add it to the query object
            if (search) {
                query.title = { $regex: search, $options: 'i' }; // case-insensitive search
            }

            try {
                const result = await needVolunteerCollection.find(query).sort(sortOption).limit(limitOption).toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'An error occurred while fetching data' });
            }
        });



        // Find need volunteer post by id
        app.get('/needvolunteer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await needVolunteerCollection.findOne(query);
            res.send(result)
        })

        // Get need volunteer post by spacific user
        app.get('/needvolunteers/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const query = { 'organizer.email': email }
            const result = await needVolunteerCollection.find(query).toArray();
            res.send(result)
        })

        // Add needvolunteerpost
        app.post('/needvolunteerpost', async (req, res) => {
            const addAnounce = req.body
            const result = await needVolunteerCollection.insertOne(addAnounce);
            res.send(result)
        })

        // Update needvolunteerpost
        app.put('/needvolunteer/:id', async (req, res) => {
            const id = req.params.id
            const updateData = req.body
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    ...updateData
                }
            };
            const result = await needVolunteerCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })

        app.delete('/needvolunteer/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await needVolunteerCollection.deleteOne(query)
            res.send(result);
        })

        // **** Be Volunteer Api Start

        // Get Volunteer request baset on specific user email
        app.get('/request/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { 'volunteer.email': email }
            const result = await requestCollection.find(query).toArray();
            res.send(result)
        })

        // get requested
        app.get('/requested/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { organizer: email };
            const result = await requestCollection.find(query).toArray();
            res.send(result)
        })

        // Be a volunteer request endpoint
        app.post('/beavolunteer', async (req, res) => {
            const request = req.body
            const result = await requestCollection.insertOne(request);
            res.send(result)
        })

        // Update status
        app.patch('/request/:id', async (req, res) => {
            const id = req.params.id
            const status = req.body
            console.log(status, id);
            const query = { _id: new ObjectId(id) }
            const updateStatus = {
                $set: status
            }
            const result = await requestCollection.updateOne(query, updateStatus)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send('ServeJoy is comming')
});


app.listen(port, () => {
    console.log(`ServeJoy listening from port ${port}`);
})