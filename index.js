const express = require('express');
const cors = require('cors');
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


        app.get('/needvolunteers', async (req, res) => {
            const result = await needVolunteerCollection.find().toArray()
            res.send(result)
        })

        app.get('/needvolunteers/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await needVolunteerCollection.findOne(query);
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