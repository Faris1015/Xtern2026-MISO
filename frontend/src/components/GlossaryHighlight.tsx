import { memo, useMemo, type ReactNode } from "react";
import { useGlossary } from "../context/GlossaryContext";
import { GlossaryTooltip } from "./GlossaryTooltip";

type Props = {
  text?: string | null;
  className?: string;
  onSearch?: (query: string) => void;
};

export const GlossaryHighlight = memo(function GlossaryHighlight({
  text,
  className,
  onSearch,
}: Props) {
  const { regex, getTerm } = useGlossary();

  const nodes = useMemo(() => {
    if (!text) return null;

    // Fast path: if no regex match in text, return plain string
    regex.lastIndex = 0;
    if (!regex.test(text)) {
      return text;
    }
    regex.lastIndex = 0;

    // Build capturing regex so split preserves matched tokens
    // We capture the matched acronym
    const capturingPattern = new RegExp(regex.source, "g");
    const parts = text.split(capturingPattern);

    const elements: ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const term = getTerm(part);
      if (term) {
        elements.push(
          <GlossaryTooltip
            key={`glossary-${part}-${i}`}
            term={term}
            onSearch={onSearch}
          >
            {part}
          </GlossaryTooltip>,
        );
      } else {
        elements.push(part);
      }
    }

    return elements;
  }, [text, regex, getTerm, onSearch]);

  if (!nodes) return null;

  if (className) {
    return <span className={className}>{nodes}</span>;
  }

  return <>{nodes}</>;
});
