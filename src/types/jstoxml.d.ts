declare module "jstoxml" {
  interface XMLOptions {
    header?: boolean;
    indent?: string;
  }

  interface XMLNode {
    _name: string;
    _attrs?: Record<string, string | number>;
    _content?: string | XMLNode | XMLNode[];
  }

  export function toXML(obj: XMLNode, options?: XMLOptions): string;
} 