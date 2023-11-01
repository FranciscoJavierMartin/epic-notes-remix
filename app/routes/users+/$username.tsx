import { json, type DataFunctionArgs } from '@remix-run/node';
import {
	Link,
	type MetaFunction,
	useLoaderData,
	useRouteError,
} from '@remix-run/react';
import { db } from '@/utils/db.server';
import { invariantResponse } from '@/utils/misc';

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username;

	return [
		{ title: `${displayName} | Epic Notes` },
		{ name: 'description', content: `Profile of ${displayName} on Epic Notes` },
	];
};

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

export function ErrorBoundary() {
	const error = useRouteError();

	return (
		<div className='container mx-auto flex h-full w-full items-center justify-center bg-destructive p-20 text-h2 text-destructive-foreground'>
			<p>Oh no, something went wrong. Sorry about that.</p>
		</div>
	);
}
