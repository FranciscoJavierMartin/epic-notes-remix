import { json, type DataFunctionArgs, redirect } from '@remix-run/node';
import {
	Form,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/utils/db.server';
import { invariantResponse } from '@/utils/misc';
import { StatusButton } from '@/components/ui/status-button';

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

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData();
	const title = formData.get('title');
	const content = formData.get('content');

	invariantResponse(typeof title === 'string', 'title must be a string');
	invariantResponse(typeof content === 'string', 'content must be a string');

	db.note.update({
		where: { id: { equals: params.noteId } },
		data: { title, content },
	});

	return redirect(`/users/${params.username}/notes/${params.noteId}`);
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const formAction = useFormAction();
	const isSubmitting =
		navigation.state !== 'idle' &&
		navigation.formMethod === 'POST' &&
		navigation.formAction === formAction;

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
				<StatusButton
					type='submit'
					disabled={isSubmitting}
					status={isSubmitting ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</Form>
	);
}
