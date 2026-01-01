import { Streamdown } from '@phaserjs/streamdown-lite';

interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps): React.ReactElement {
  return <Streamdown>{children}</Streamdown>;
}
