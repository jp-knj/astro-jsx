import { html, jsx } from 'astro-jsx/runtime';
import type {
  AttributeValue,
  ClassAttributeValue,
  HtmlNode,
} from '../../src/runtime/types/nodes';

const allowed = jsx('div', { id: 'ok' });
void allowed;

const markup = html('<em>raw</em>');

type HtmlShouldNotBeAttribute = HtmlNode extends AttributeValue ? never : true;
const htmlCheck: HtmlShouldNotBeAttribute = true;
void htmlCheck;

type NumberNotClassValue = number extends ClassAttributeValue ? never : true;
const classCheck: NumberNotClassValue = true;
void classCheck;

const component = () => html('<span/>');
const elementChild = jsx(component, undefined);
void elementChild;
