import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/jwt';

interface Context {
  userId?: string;
}

export const resolvers = {
  Query: {
    students: async (_parent: any, _args: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Unauthorized: You must be logged in to view students.');
      }
      return await prisma.student.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },
    student: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Unauthorized: You must be logged in to view a student.');
      }
      const student = await prisma.student.findUnique({
        where: { id },
      });
      if (!student) {
        throw new Error('Student not found');
      }
      return student;
    },
  },

  Mutation: {
    register: async (_parent: any, { email, password }: any) => {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new Error('Email is already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      const token = generateToken({ userId: user.id });
      return {
        token,
        user,
      };
    },

    login: async (_parent: any, { email, password }: any) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      const token = generateToken({ userId: user.id });
      return {
        token,
        user,
      };
    },

    addStudent: async (_parent: any, { name, email, age, course, profileUrl }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Unauthorized: You must be logged in to add students.');
      }

      const existingStudent = await prisma.student.findUnique({
        where: { email },
      });
      if (existingStudent) {
        throw new Error('Student email already exists');
      }

      return await prisma.student.create({
        data: {
          name,
          email,
          age,
          course,
          profileUrl,
        },
      });
    },

    updateStudent: async (_parent: any, { id, name, email, age, course, profileUrl }: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Unauthorized: You must be logged in to update students.');
      }

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id },
      });
      if (!student) {
        throw new Error('Student not found');
      }

      // If email is being changed, check uniqueness
      if (email && email !== student.email) {
        const existingStudent = await prisma.student.findUnique({
          where: { email },
        });
        if (existingStudent) {
          throw new Error('Student email already in use');
        }
      }

      return await prisma.student.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(age !== undefined && { age }),
          ...(course && { course }),
          ...(profileUrl !== undefined && { profileUrl }),
        },
      });
    },

    deleteStudent: async (_parent: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Unauthorized: You must be logged in to delete students.');
      }

      const student = await prisma.student.findUnique({
        where: { id },
      });
      if (!student) {
        throw new Error('Student not found');
      }

      return await prisma.student.delete({
        where: { id },
      });
    },
  },
};
