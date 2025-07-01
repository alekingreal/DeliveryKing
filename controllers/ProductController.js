console.log('✅ ProductController carregado!');
console.log('✅ Exportando ProductController...');
console.log('✅ ProductController carregado de:', __filename);




const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProducts = async (req, res) => {
  const products = await prisma.product.findMany();

  // Buscar cotação atual do DK Coin
  const cotacaoDK = await prisma.cotacaoDK.findFirst({
    orderBy: { data: 'desc' }
  });

  const cotacao = cotacaoDK?.valorAtual || 1.0;
  const desconto = 0.10; // 10% de desconto padrão

  const produtosConvertidos = products.map(prod => {
    const precoComDesconto = prod.price * (1 - desconto);
    const precoDK = (precoComDesconto / cotacao).toFixed(2);
    
    return {
      ...prod,
      precoDK: parseFloat(precoDK),
      descontoPercentual: desconto * 100
    };
  });

  res.json(produtosConvertidos);
};
const getProductById = async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

  if (!product) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }

  res.json(product);
};

const createProduct = async (req, res) => {
  const { name, description, price, imageUrl, restaurantId, category } = req.body;

  if (!name || !price || !restaurantId || !category) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        restaurantId: parseInt(restaurantId),
        category: category // ✅ valor vindo do req.body
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto', error });
  }
};



const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl } = req.body;

  const updated = await prisma.product.update({
    where: { id: parseInt(id) },
    data: { name, description, price: parseFloat(price), imageUrl }
  });

  res.json(updated);
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  await prisma.product.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Produto excluído com sucesso!' });
};

const getHighlightedProducts = async (req, res) => {
    const { city, category } = req.query;
  
    const products = await prisma.product.findMany({
      where: {
        category: category,
        restaurant: {
          city: city
        }
      },
      take: 10,
      orderBy: {
        id: 'desc'
      },
      include: {
        restaurant: true
      }
    });
  
    res.json(products);
  };
  
  


  module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getHighlightedProducts   // ← Aqui!
  };
  
  