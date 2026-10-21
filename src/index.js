const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const supplierRoutes = require('./routes/supplier.routes');
const rawMaterialRoutes = require('./routes/rawMaterial.routes');
const productRoutes = require('./routes/product.routes');
const recipeItemRoutes = require('./routes/recipeItem.routes');

dotenv.config({ path: path.resolve(__dirname, "../.env") });

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
    } else {
        res.header("Access-Control-Allow-Origin", "*");
    }
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
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/raw-materials', rawMaterialRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/recipes', recipeItemRoutes);


let server;
if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;

