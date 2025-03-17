require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-store-backend';

async function connectDB() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado ao MongoDB');
    } catch (err) {
        console.error('❌ Erro ao conectar ao MongoDB:', err.message);
        console.error('Detalhes do erro:', err);
        process.exit(1); // Encerra o servidor caso a conexão falhe
    }
}

connectDB();

// Definindo o modelo de Produto
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String, // URL da imagem no Cloudinary
    category: { type: String, required: true } // Adicionando a categoria
});

const Product = mongoose.model('Product', productSchema);

// Definindo o modelo de Categoria
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const Category = mongoose.model('Category', categorySchema);

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do multer com storage no Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products', // Pasta onde as imagens serão armazenadas no Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png'] // Formatos permitidos
    }
});

const upload = multer({ storage });

// Middlewares
app.use(bodyParser.json());
// Configuração do CORS para permitir apenas o domínio do admin portal:
app.use(cors({
    origin: [
        'https://online-store-admin-portal.vercel.app',
        'https://online-store-frontend.vercel.app',
        'http://127.0.0.1:5500'
    ]
}));

// Endpoint para listar produtos
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error("Erro ao listar produtos:", err);
        res.status(500).json({ message: 'Erro ao listar produtos.', error: err.message });
    }
});

// Endpoint para adicionar um produto
app.post('/api/products', upload.single('image'), async (req, res) => {
    if (!req.body.name || !req.body.price || !req.file || !req.body.category) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const newProduct = new Product({
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            image: req.file.path, // URL da imagem armazenada no Cloudinary
            category: req.body.category // Adicionando a categoria
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao adicionar produto.' });
    }
});

// Endpoint para deletar um produto
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productId);

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(204).send(); // No Content
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar produto.' });
    }
});

// Endpoint para listar categorias
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories.map(category => category.name));
    } catch (err) {
        console.error("Erro ao listar categorias:", err);
        res.status(500).json({ message: 'Erro ao listar categorias.', error: err.message });
    }
});

// Endpoint para adicionar uma categoria
app.post('/api/categories', async (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
    }

    try {
        const newCategory = new Category({ name: req.body.name });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao adicionar categoria.', error: err.message });
    }
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Algo deu errado!' });
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});