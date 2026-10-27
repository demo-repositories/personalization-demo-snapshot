import { BlockElementIcon } from '@sanity/icons/BlockElement';
import { ComposeIcon } from '@sanity/icons/Compose';
import { InlineElementIcon } from '@sanity/icons/InlineElement';
import { InsertAboveIcon } from '@sanity/icons/InsertAbove';
import { SearchIcon } from '@sanity/icons/Search';
import { UsersIcon } from '@sanity/icons/Users';
import type { FieldGroupDefinition } from 'sanity';

export const GROUP = {
  SEO: 'seo',
  MAIN_CONTENT: 'main-content',
  CARD: 'card',
  RELATED: 'related',
  OG: 'og',
  PERSONALIZATION: 'personalization',
};

export const GROUPS: FieldGroupDefinition[] = [
  // { name: CONST.MAIN_CONTENT, default: true },
  {
    name: GROUP.MAIN_CONTENT,
    icon: ComposeIcon,
    title: 'Content',
    default: true,
  },
  {
    name: GROUP.PERSONALIZATION,
    icon: UsersIcon,
    title: 'Personalization',
  },
  { name: GROUP.SEO, icon: SearchIcon, title: 'SEO' },
  {
    name: GROUP.OG,
    icon: InsertAboveIcon,
    title: 'Open Graph',
  },
  {
    name: GROUP.CARD,
    icon: BlockElementIcon,
    title: 'Card',
  },
  {
    name: GROUP.RELATED,
    icon: InlineElementIcon,
    title: 'Related',
  },
];
