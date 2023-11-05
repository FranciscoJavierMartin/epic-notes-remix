import { useRef, useState } from 'react';
import { type z } from 'zod';
import { type FieldConfig, conform, useFieldset } from '@conform-to/react';
import { type ImageFieldsetSchema } from '@/routes/users+/$username_+/notes.$noteId_.edit';
import { Label } from './label';
import { Textarea } from './textarea';
import { cn, getNoteImgSrc } from '@/utils/misc';
import { Icon } from './icon';
import { ErrorList } from '../forms';

export const ImageChooser = ({
	config,
}: {
	config: FieldConfig<z.infer<typeof ImageFieldsetSchema>>;
}) => {
	const ref = useRef<HTMLFieldSetElement>(null);
	const fields = useFieldset(ref, config);
	const existingImage = Boolean(fields.id.defaultValue);
	const [previewImage, setPreviewImage] = useState<string | null>(
		fields.id.defaultValue ? getNoteImgSrc(fields.id.defaultValue) : null,
	);
	const [altText, setAltText] = useState<string>(
		fields.altText.defaultValue ?? '',
	);

	return (
		<fieldset ref={ref} {...conform.fieldset(config)}>
			<div className='flex gap-3'>
				<div className='w-32'>
					<div className='relative h-32 w-32'>
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-4': !existingImage,
							})}
						>
							{previewImage ? (
								<div className='relative'>
									<img
										src={previewImage}
										alt={altText ?? ''}
										className='h-32 w-32 rounded-lg object-cover'
									/>
									{existingImage ? null : (
										<div className='pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md'>
											new
										</div>
									)}
								</div>
							) : (
								<div className='flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground'>
									<Icon name='plus' />
								</div>
							)}
							{existingImage ? (
								<input {...conform.input(fields.id, { type: 'hidden' })} />
							) : null}
							<input
								aria-label='Image'
								accept='image/*'
								className='absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0'
								onChange={(event) => {
									const file = event.target.files?.[0];

									if (file) {
										const reader = new FileReader();

										reader.onloadend = () => {
											setPreviewImage(reader.result as string);
										};

										reader.readAsDataURL(file);
									} else {
										setPreviewImage(null);
									}
								}}
								{...conform.input(fields.file, {
									type: 'file',
								})}
							/>
						</label>
					</div>
					<div className='min-h-[32px] px-4 pb-3 pt-1'>
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className='flex-1'>
					<Label htmlFor={fields.altText.id}>Alt text</Label>
					<Textarea
						onChange={(e) => setAltText(e.currentTarget.value)}
						{...conform.textarea(fields.altText)}
					/>
					<div className='min-h-[32px] px-4 pb-3 pt-1'>
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className='min-h-[32px] px-4 pb-3 pt-1'>
				<ErrorList id={config.errorId} errors={config.errors} />
			</div>
		</fieldset>
	);
};
