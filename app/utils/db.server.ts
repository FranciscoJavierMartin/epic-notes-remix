/**
 * Don't worry too much about this file. It's just an in-memory "database"
 * for the purposes of our workshop. The data modeling workshop will cover
 * the proper database.
 */
import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import { singleton } from './singleton.server';

export const prisma = singleton('prisma', () => {
	const logThreshold = 0;

	const client = new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'stdout' },
			{ level: 'info', emit: 'stdout' },
			{ level: 'warn', emit: 'stdout' },
		],
	});

	client.$on('query', async (e) => {
		if (e.duration >= logThreshold) {
			const color =
				e.duration < logThreshold * 1.1
					? 'green'
					: e.duration < logThreshold * 1.2
					? 'blue'
					: e.duration < logThreshold * 1.3
					? 'yellow'
					: e.duration < logThreshold * 1.4
					? 'redBright'
					: 'red';
			const duration = chalk[color](`${e.duration}ms`);
			console.info(`prisma:query - ${duration} - ${e.query}`);
		}
	});

	client.$connect();

	return client;
});
