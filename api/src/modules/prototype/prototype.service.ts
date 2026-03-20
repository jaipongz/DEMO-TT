import { Injectable } from '@nestjs/common';

type LookupOption = { value: string; label: string };

@Injectable()
export class PrototypeService {
  async getLookup(field?: string, lang?: string): Promise<{ field: string; lang: string; options: LookupOption[] }> {
    const normalizedField = String(field || '');
    const normalizedLang = String(lang || 'en');

    if (field === 'category') {
      return {
        field: normalizedField || 'category',
        lang: normalizedLang,
        options: [
          { value: 'news', label: 'News' },
          { value: 'blog', label: 'Blog' },
          { value: 'tutorial', label: 'Tutorial' },
        ],
      };
    }

    if (field === 'status') {
      return {
        field: normalizedField || 'status',
        lang: normalizedLang,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
        ],
      };
    }

    if (field === 'flags') {
      return {
        field: normalizedField || 'flags',
        lang: normalizedLang,
        options: [
          { value: 'featured', label: 'Featured' },
          { value: 'pinned', label: 'Pinned' },
          { value: 'sponsored', label: 'Sponsored' },
        ],
      };
    }

    return { field: normalizedField, lang: normalizedLang, options: [] };
  }
}
