const prisma = require('../config/database');

const findUserByEmail = async (email) => {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });
};

const findUserById = async (id) => {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });
};

const findRoleByName = async (name) => {
  return prisma.role.findUnique({
    where: { name }
  });
};

const findUsers = async (where, skip, take) => {
  return prisma.user.findMany({
    where,
    skip,
    take,
    include: { role: true },
    orderBy: { id: 'desc' }
  });
};

const countUsers = async (where) => {
  return prisma.user.count({ where });
};

const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    include: { role: true }
  });
};

const softDeleteUser = async (id) => {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
  findRoleByName,
  findUsers,
  countUsers,
  updateUser,
  softDeleteUser
};
