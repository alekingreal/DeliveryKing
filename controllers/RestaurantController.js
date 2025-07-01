const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllRestaurants = async (req, res) => {
  const restaurants = await prisma.restaurant.findMany();
  res.json(restaurants);
};

const getRestaurantById = async (req, res) => {
  const { id } = req.params;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: parseInt(id) } });

  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurante não encontrado' });
  }

  res.json(restaurant);
};

const createRestaurant = async (req, res) => {
  const { name, description } = req.body;

  const newRestaurant = await prisma.restaurant.create({
    data: { name, description }
  });

  res.status(201).json(newRestaurant);
};

const updateRestaurant = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const updated = await prisma.restaurant.update({
    where: { id: parseInt(id) },
    data: { name, description }
  });

  res.json(updated);
};

const deleteRestaurant = async (req, res) => {
  const { id } = req.params;

  await prisma.restaurant.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Restaurante excluído com sucesso!' });
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
