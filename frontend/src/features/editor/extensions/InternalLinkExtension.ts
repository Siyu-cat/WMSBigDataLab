import { Node, mergeAttributes } from '@tiptap/react';

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    internalLink: {
      setInternalLink: (attrs: { entryId: string; entryTitle: string }) => ReturnType;
      toggleInternalLink: (attrs: { entryId: string; entryTitle: string }) => ReturnType;
      unsetInternalLink: () => ReturnType;
    };
  }
}

const InternalLinkExtension = Node.create({
  name: 'internalLink',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      entryId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-entry-id') || '',
        renderHTML: (attributes) => ({ 'data-entry-id': attributes.entryId }),
      },
      entryTitle: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-entry-title') || '',
        renderHTML: (attributes) => ({ 'data-entry-title': attributes.entryTitle }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="internal-link"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'internal-link',
        'class': 'internal-link',
        'contenteditable': 'false',
        'style': 'color: #1890ff; cursor: pointer; text-decoration: underline; padding: 0 2px; background: rgba(24,144,255,0.1); border-radius: 3px;',
      }),
      `{{${HTMLAttributes.entryTitle || '未知词条'}}}`,
    ];
  },

  addCommands() {
    return {
      setInternalLink:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
      toggleInternalLink:
        (attrs) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'text', attrs);
        },
      unsetInternalLink:
        () =>
        ({ commands }) => {
          return commands.deleteNode(this.name);
        },
    };
  },
});

export default InternalLinkExtension;