import { Button } from '@/components/ui/button';
import { db } from '@/utils/db.server';
import { invariantResponse } from '@/utils/misc';
import { json, type DataFunctionArgs, redirect } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';

export async function loader({ params }: DataFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	});

	invariantResponse(note, 'Note not found', { status: 404 });

	return json({
		note: { title: note.title, content: note.content },
	});
}

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData();
	const intent = formData.get('intent');

	invariantResponse(intent === 'delete', 'Invalid intent');

	db.note.delete({ where: { id: { equals: params.noteId } } });
	return redirect(`/users/${params.username}/notes`);
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className='absolute inset-0 flex flex-col px-10'>
			<h2 className='mb-2 pt-12 text-h2 lg:mb-6'>{data.note.title}</h2>
			<div className='overflow-y-auto pb-24'>
				<p className='whitespace-break-spaces text-sm md:text-lg'>
					{data.note.content}
				</p>
			</div>
			<div className='floating-toolbar'>
				<Form method='POST'>
					<Button
						type='submit'
						variant='destructive'
						name='intent'
						value='delete'
					>
						Delete
					</Button>
				</Form>
				<Button asChild>
					<Link to='edit'>Edit</Link>
				</Button>
			</div>
		</div>
	);
}