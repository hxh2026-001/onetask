'use client';

import { useState, useEffect, useRef } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  errors?: Array<{ line: number; column: number; message: string }>;
}

export default function CodeEditor({ code, onChange, errors = [] }: CodeEditorProps) {
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayLines(code.split('\n'));
  }, [code]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const errorLines = new Set(errors.map(e => e.line));

  return (
    <div className="code-editor">
      <div className="line-numbers" ref={lineNumbersRef}>
        {displayLines.map((_, index) => (
          <div
            key={index}
            className={`line-number ${errorLines.has(index + 1) ? 'error' : ''}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="code-textarea"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder="在这里输入代码..."
      />
    </div>
  );
}
