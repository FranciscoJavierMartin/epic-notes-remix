import { json, type DataFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { db } from '@/utils/db.server';
import { invariantResponse } from '@/utils/misc';

export async function loader({ params }: DataFunctionArgs) {
	const user = db.user.findFirst({
		where: {
			username: {
				equals: params.username,
			},
		},
	});

	invariantResponse(user, 'User not found', { status: 404 });

	return json({ user: { name: user.name, username: user.username } });
}

export default function KodyProfileRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className='container mb-48 mt-36'>
			<h1 className='text-h1'>{data.user.name ?? data.user.username}</h1>
			<Link to='notes' className='underline' prefetch='intent'>
				Notes
			</Link>
		</div>
	);
}
