import {assertType, describe, expect, expectTypeOf, it} from 'vitest';
import type {DocumentType} from '../src/lib';
import {defineDocumentType} from '../src/lib';

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
		expect(documentType.compute).toBeTypeOf('function');
	});
});
