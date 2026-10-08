const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');

dotenv.config();

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Bite Ledger API is running smoothly!'
    });
});

app.use('/api/v1/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
