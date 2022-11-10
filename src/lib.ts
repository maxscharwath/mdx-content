import * as fs from 'fs';
import type {ZodFirstPartySchemaTypes} from 'zod';
import {z} from 'zod';
import {globbyStream} from 'globby';
import {bundleMDX} from 'mdx-bundler';
import * as path from 'path';
import * as process from 'process';

type MdxOptions = ReturnType< Exclude<Parameters<typeof bundleMDX>[0]['mdxOptions'], undefined>>;

type Pluralize<T extends string> = T extends `${infer A}y` ? `${A}ies` : T extends `${infer A}s` ? `${A}s` : `${T}s`;

function pluralize<T extends string>(str: T): Pluralize<T> {
	return (str.endsWith('s') ? str : str.endsWith('y') ? str.slice(0, -1) + 'ies' : `${str}s`) as Pluralize<T>;
}

type Awaitable<T> = T | Promise<T>;

type DocumentOption<Name extends string = string> = {
	name: Name;
	filePathPattern: string;
	fields: Record<string, (x: typeof z) => ZodFirstPartySchemaTypes>;
	computedFields: Record<string, (source: Document<DocumentOption, MetadataField<DocumentOption>>) => Awaitable<any>>;
};

type MetadataField<D extends DocumentOption> = {
	[K in keyof D['fields']]: z.infer<ReturnType<D['fields'][K]>>
};

type MetadataComputedField<D extends DocumentOption> = {
	[K in keyof D['computedFields']]: Awaited<ReturnType<D['computedFields'][K]>>
};

type Metadata<D extends DocumentOption> = MetadataField<D> & MetadataComputedField<D>;

type AllMetadata<D extends DocumentOption> = Metadata<D> | MetadataField<D> | MetadataComputedField<D>;

type Document<D extends DocumentOption = DocumentOption, M extends AllMetadata<D> = Metadata<D>> = {
	metadata: M;
	path: string;
	body: {
		raw: string;
		code: string;
	};
};

type DocumentType<D extends DocumentOption = DocumentOption> = {
	document: D;
	compute: (options: ComputeDocumentOptions) => Promise<Array<Document<D>>>;
};

type SourceOptions<DocumentTypes = readonly DocumentType[]> = {
	documentTypes: DocumentTypes;
	documentFolder: string;
	mdxOptions?: MdxOptions;
};

type Source<S extends SourceOptions> = {
	[K in Pluralize<S['documentTypes'][number]['document']['name']>]:
	S['documentTypes'] extends ReadonlyArray<DocumentType<infer D>> ?
		D extends DocumentOption<infer N> ?
			Pluralize<N> extends K ? Array<Document<D>> : never
			: never
		: never
};

/**
 * Infer the Document type from the DocumentType type
 */
export type InferDocument<Dt extends DocumentType> = Dt extends DocumentType<infer D> ? Document<D> : never;

type ComputeDocumentOptions = {
	cwd: string;
	mdxOptions?: MdxOptions;
};

async function computeDocuments<T extends DocumentOption & ComputeDocumentOptions>(options: T) {
	const schema = z.object(
		Object.fromEntries(
			Object.entries(options.fields).map(([key, value]) => [key, value(z)]),
		),
	);
	const documents: Array<Document<T, Metadata<T>>> = [];

	for await (const globPath of globbyStream(options.filePathPattern, {cwd: options.cwd})) {
		const documentPath = path.join(options.cwd, globPath.toString());
		const source = await fs.promises.readFile(documentPath, 'utf8');
		const {code, matter} = await bundleMDX({
			source,
			cwd: options.cwd,
			mdxOptions: processorOptions => Object.assign(processorOptions, options.mdxOptions ?? {}),
		});
		const safeParse = schema.safeParse(matter.data);

		if (!safeParse.success) {
			continue;
		}

		const result: Document<T, MetadataField<T>> = {
			metadata: safeParse.data as MetadataField<T>,
			path: documentPath,
			body: {
				raw: matter.content,
				code,
			},
		};

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const metadata: Metadata<T> = {
			...result.metadata,
			...Object.fromEntries(
				await Promise.all(
					Object.entries(options.computedFields)
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return
						.map(async ([key, fn]) => [key, await fn(result)]),
				),
			),
		};

		documents.push({
			...result,
			metadata,
		});
	}

	return documents;
}

/**
 * Define a new DocumentType
 * @param document
 */
export function defineDocumentType<T extends DocumentOption>(document: Readonly<T>): DocumentType<T> {
	return {
		document,
		async compute(options) {
			return computeDocuments({
				...options,
				...document,
			});
		},
	};
}

export async function makeSource<T extends SourceOptions>(options: T): Promise<Source<T>> {
	return Object.fromEntries(
		await Promise.all(
			options.documentTypes.map(async dt => [
				pluralize(dt.document.name),
				await dt.compute({
					cwd: path.resolve(process.cwd(), options.documentFolder),
					mdxOptions: options.mdxOptions,
				}),
			]),
		),
	) as Source<T>;
}
