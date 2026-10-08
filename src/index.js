const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Bite Ledger API is running smoothly!'
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
