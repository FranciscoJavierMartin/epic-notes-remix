import { json, type DataFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/utils/db.server';
import { invariantResponse } from '@/utils/misc';

export async function loader({ params }: DataFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	});

	invariantResponse(note, 'Note not found', { status: 404 });

	return json({ note: { title: note.title, content: note.content } });
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>();

	return (
		<Form
			method='POST'
			className='flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12'
		>
			<div className='flex flex-col gap-1'>
				<div>
					<Label>Title</Label>
					<Input name='title' defaultValue={data.note.title} />
				</div>
				<div>
					<Label>Content</Label>
					<Textarea name='content' defaultValue={data.note.content} />
				</div>
			</div>
			<div className='floating-toolbar'>
				<Button variant='destructive' type='reset'>
					Reset
				</Button>
				<Button type='submit'>Submit</Button>
			</div>
		</Form>
	);
}
