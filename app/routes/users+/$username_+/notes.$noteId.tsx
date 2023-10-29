import { useParams } from '@remix-run/react';

export default function SomeNoteId() {
	const params = useParams();

	return (
		<div className='container pt-12 border-8 border-red-500'>
			<h1 className='text-h2'>{params.noteId}</h1>
		</div>
	);
}
