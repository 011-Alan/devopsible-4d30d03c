import React, { useState, useRef, useEffect } from "react";

export type OutputLine = {
  text: string;
  kind: "cmd" | "out" | "err" | "sys";
};

interface TerminalViewProps {
  lines: OutputLine[];
  onExecute: (command: string) => void;
  promptUser?: string;
  placeholder?: string;
}

export function TerminalView({
  lines,
  onExecute,
  promptUser = "student@devopsible:~/lab$",
  placeholder = "Type a command...",
}: TerminalViewProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");
    onExecute(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx] || "");
      }
    }
  };

  return (
    <div
      className="flex-1 flex flex-col bg-[#050811] font-mono text-[13px] text-slate-200 p-4 overflow-hidden cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-2">
        {lines.map((line, idx) => {
          if (line.kind === "cmd") {
            return (
              <div key={idx} className="flex items-start gap-2 text-slate-100">
                <span className="text-emerald-400 font-semibold shrink-0 select-none">
                  {promptUser}
                </span>
                <span className="font-semibold text-white whitespace-pre-wrap break-all">
                  {line.text}
                </span>
              </div>
            );
          }
          if (line.kind === "err") {
            return (
              <div key={idx} className="text-rose-400 whitespace-pre-wrap break-all pl-2">
                {line.text}
              </div>
            );
          }
          if (line.kind === "sys") {
            return (
              <div key={idx} className="text-cyan-400/90 whitespace-pre-wrap break-all font-medium">
                {line.text}
              </div>
            );
          }
          return (
            <div key={idx} className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed pl-1">
              {line.text}
            </div>
          );
        })}

        {/* Live Input Prompt */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <span className="text-emerald-400 font-semibold shrink-0 select-none">
            {promptUser}
          </span>
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent border-none outline-none text-white font-mono text-[13px] p-0 placeholder:text-slate-600 focus:ring-0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
