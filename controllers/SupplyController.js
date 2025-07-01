// controllers/SupplyController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSupplyInfo = async (req, res) => {
  const supply = await prisma.supplyDK.findFirst();

  const carteiraMaster = await prisma.carteiraDK.findUnique({
    where: { userId: 999 },
  });

  res.json({
    totalSupply: supply.totalSupply,
    reserved: supply.reserved,
    available: supply.totalSupply - supply.reserved,
    receitaMasterDK: carteiraMaster?.saldo || 0,
  });
};

module.exports = { getSupplyInfo };
