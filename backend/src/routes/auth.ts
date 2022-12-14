import { Request, Response, Express } from 'express';
import config from 'config'
import jwt from 'jsonwebtoken';
import bcrypt, { hash } from 'bcrypt';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { createHttpError, defaultEndpointsFactory, Routing, EndpointsFactory } from "express-zod-api";
import { z } from 'zod'
import { client } from 'libs/db';


const UserModel = z.object({
	id: z.string().uuid(),
	createdAt: z.date(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	email: z.string().email(),
	role: z.string().optional(),
})

function createUserJWT(user: User): string {
	return jwt.sign(
		{ ...user, password: undefined },
		config.auth.jwt.key,
		{ expiresIn: config.auth.jwt.expiration }
	);
}

async function getUser(prisma: PrismaClient, email: string) {
	try {
		return prisma.user.findFirst({ where: { email: email } });
	} catch {
		return undefined
	}
}

const signupEndpoint = defaultEndpointsFactory.build({
	method: "post",
	input: z.object({
		email: z.string().email(),
		password: z.string().min(8).regex(
			/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])/,
			{ message: 'Password must contain one uppercase letter, one lowercase letter, and one special character(#?!@$%^&*-)' }
		),
	}),
	output: z.object({
		user: UserModel,
		token: z.string(),
	}),
	handler: async ({ 
		input: {
			email,
			password,
		}
	}) => {
		const existingUser = await getUser(client, email);

		if (existingUser) {
			throw createHttpError(400, 'This user already exists')
		}

		const newUser: Prisma.UserCreateInput = {
			firstName: '',
			lastName: '',
			email,
			password: await hash(password, 12),
		};
		
		const user = await client.user.create({ data: newUser });

		const token = createUserJWT(user);
		
		return {
			user: { 
				...user, 
				password: undefined,
				role: undefined,
			},
			token,
		}
	},
})

const loginEndpoint = defaultEndpointsFactory.build({
	method: "post",
	input: z.object({
		email: z.string().email(),
		password: z.string(),
	}),
	output: z.object({
		user: UserModel,
		token: z.string(),
	}),
	handler: async ({ 
		input: {
			email,
			password,
		}
	}) => {
		const user = await getUser(client, email);

		if (!user) {
			throw createHttpError(404, 'This user does not exist')
		}

		const token = createUserJWT(user);

		// If invalid password, throw error
		if (!await bcrypt.compare(password, user.password)) {
			throw createHttpError(400, 'Invalid password')
		}

		return {
			user: { 
				...user, 
				password: undefined,
				role: undefined,
			},
			token,
		}
	},
})

export default {
	login: loginEndpoint,
	signup: signupEndpoint,
}
