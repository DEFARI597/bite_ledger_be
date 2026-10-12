const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Bite Ledger API is running smoothly!'
    });
});

app.use('/api/v1/auth', authRoutes);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
