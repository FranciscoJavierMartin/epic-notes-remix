import { redirect, type DataFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { GeneralErrorBoundary } from '@/components/error-boundary';
import { SearchBar } from '@/components/search-bar';
import { prisma } from '@/utils/db.server';
import { cn, getUserImgSrc, useDelayedIsPending } from '@/utils/misc';
import { ErrorList } from '@/components/forms';

const UserSearchResultSchema = z.object({
	id: z.string(),
	username: z.string(),
	name: z.string().nullable(),
	imageId: z.string().nullable(),
});

const UserSearchResultsSchema = z.array(UserSearchResultSchema);

export async function loader({ request }: DataFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search');

	if (searchTerm === '') {
		return redirect('/users');
	}

	const like = `%${searchTerm ?? ''}%`;

	const rawUsers = await prisma.$queryRaw`
		SELECT User.id, User.username, User.name, UserImage.id AS imageId
		FROM User
		LEFT JOIN UserImage ON UserImage.userId = User.id
		WHERE User.username LIKE ${like}
		OR User.name LIKE ${like}
		ORDER BY (
			SELECT Note.updatedAt
			FROM Note
			WHERE Note.ownerId = user.id
			ORDER BY Note.updatedAt DESC
			LIMIT 1
		) DESC
		LIMIT 50
	`;

	const result =
		process.env.NODE_ENV === 'production'
			? ({
					success: true,
					data: rawUsers as z.infer<typeof UserSearchResultsSchema>,
			  } as const)
			: UserSearchResultsSchema.safeParse(rawUsers);

	return result.success
		? json({ status: 'idle', users: result.data } as const)
		: json({ status: 'error', error: result.error.message } as const, {
				status: 400,
		  });
}

export default function UsersRoute() {
	const data = useLoaderData<typeof loader>();
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/users',
	});

	if (data.status === 'error') {
		console.error(data.error);
	}

	return (
		<div className='container mb-48 mt-36 flex flex-col items-center justify-center gap-6'>
			<h1 className='text-h1'>Epic Notes Users</h1>
			<div className='w-full max-w-[700px]'>
				<SearchBar status={data.status} autoFocus autoSubmit />
			</div>
			<main>
				{data.status === 'idle' ? (
					data.users.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.users.map((user) => (
								<li key={user.id}>
									<Link
										to={user.username}
										className='flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3'
									>
										<img
											alt={user.name ?? user.username}
											src={getUserImgSrc(user.imageId)}
											className='h-16 w-16 rounded-full'
										/>
										{user.name ? (
											<span className='w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md'>
												{user.name}
											</span>
										) : null}
										<span className='w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground'>
											{user.username}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p>No users found</p>
					)
				) : data.status === 'error' ? (
					<ErrorList errors={['There was an error parsing the results']} />
				) : null}
			</main>
		</div>
	);
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
