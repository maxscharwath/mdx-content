import {assertType, describe, expect, it} from 'vitest';
import type {DocumentType} from '../src';
import { defineDocumentType, makeSource } from '../src'

describe('defineDocumentType', () => {
	it('should defineDocumentType is defined', () => {
		expect(defineDocumentType).toBeDefined();
		expect(defineDocumentType).toBeInstanceOf(Function);
	});

	it('should defineDocumentType create a DocumentType', () => {
		const documentType = defineDocumentType({
			name: 'post',
			filePathPattern: 'posts/**/*.mdx',
			fields: {
			},
			computedFields: {
			},
		});

		expect(documentType).toBeDefined();
		expect(documentType).toBeInstanceOf(Object);
		assertType<DocumentType>(documentType);

		expect(documentType.document).toBeDefined();
	});

	it('should defineDocumentType create a DocumentType with fields', async () => {
		const documentType = defineDocumentType({
			name: 'post',
			filePathPattern: 'posts/**/*.mdx',
			fields: {
				title: z => z.string().transform(x => x.toUpperCase()),
				publishedAt: z => z.date(),
				status: z => z.enum(['draft', 'published']),
			},
			computedFields: {
				hello: () => 'world',
			},
		});

		const sources = makeSource({
			documentFolder: 'tests/content',
			documentTypes: [documentType]
		})

		expect(sources).toBeDefined();
		expect(sources.posts).toBeDefined();
		const posts = await sources.posts;
		expect(posts).toBeInstanceOf(Array);

		const post = posts[0];
		expect(post).toBeDefined();
		expect(post.metadata).toBeDefined();
		expect(post.metadata.title).toBe('UNTITLED');
		expect(post.metadata.publishedAt).toBeInstanceOf(Date);
		expect(post.metadata.status).toBe('draft');
		expect(post.metadata.hello).toBe('world');
	});
});
