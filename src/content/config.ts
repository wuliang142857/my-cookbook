// ABOUTME: Content collection configuration for Astro Starlight documentation.
// ABOUTME: Defines the docs collection schema using Starlight's built-in schema.

import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ schema: docsSchema() }),
};
