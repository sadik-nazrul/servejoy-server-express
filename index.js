const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 9001


const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174'
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

// Midlewares
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('ServeJoy is comming')
});


app.listen(port, () => {
    console.log(`ServeJoy listening from port ${port}`);
})