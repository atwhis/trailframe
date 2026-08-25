import { DOMParser } from "@xmldom/xmldom";

export function parseXml(xml: string): Document {
  const errors: string[] = [];
  const document = new DOMParser({
    errorHandler: {
      warning: () => undefined,
      error: (message) => errors.push(String(message)),
      fatalError: (message) => errors.push(String(message)),
    },
  }).parseFromString(xml, "application/xml");

  if (!document?.documentElement || errors.length > 0) {
    throw new Error(`XML 文件无法解析${errors[0] ? `：${errors[0]}` : ""}`);
  }
  return document as unknown as Document;
}

export function elementsByLocalName(root: Document | Element, name: string): Element[] {
  const all = root.getElementsByTagName("*");
  const matches: Element[] = [];
  for (let index = 0; index < all.length; index += 1) {
    const element = all.item(index);
    if (element && (element.localName === name || element.nodeName === name || element.nodeName.endsWith(`:${name}`))) {
      matches.push(element as unknown as Element);
    }
  }
  return matches;
}

export function firstDirectText(root: Element, name: string): string | undefined {
  for (let index = 0; index < root.childNodes.length; index += 1) {
    const node = root.childNodes.item(index);
    if (node?.nodeType === 1) {
      const element = node as unknown as Element;
      if (element.localName === name || element.nodeName === name || element.nodeName.endsWith(`:${name}`)) {
        const value = element.textContent?.trim();
        return value || undefined;
      }
    }
  }
  return undefined;
}

export function finiteNumber(value: string | null | undefined): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
