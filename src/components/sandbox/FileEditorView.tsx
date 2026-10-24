import { useState, useEffect } from "react";
import { FileCode, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileEditorViewProps {
  files: Record<string, string>;
  onSaveFile: (filename: string, content: string) => void;
}

export function FileEditorView({ files, onSaveFile }: FileEditorViewProps) {
  const fileNames = Object.keys(files);
  const [selectedFile, setSelectedFile] = useState<string>(fileNames[0] || "Dockerfile");
  const [content, setContent] = useState<string>(files[selectedFile] || "");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (fileNames.length && !files[selectedFile]) {
      setSelectedFile(fileNames[0]);
      setContent(files[fileNames[0]] || "");
    } else {
      setContent(files[selectedFile] || "");
    }
  }, [files, selectedFile]);

  const handleSave = () => {
    onSaveFile(selectedFile, content);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  if (!fileNames.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 font-mono text-sm bg-[#050811]">
        <FileCode className="h-10 w-10 mb-2 opacity-40" />
        No files in this sandbox environment.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050811] h-full overflow-hidden">
      {/* File Tabs & Save Bar */}
      <div className="flex items-center justify-between border-b border-[#1b263e] bg-[#090e1c] px-3 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {fileNames.map((name) => (
            <button
              key={name}
              onClick={() => {
                setSelectedFile(name);
                setContent(files[name] || "");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                selectedFile === name
                  ? "bg-[#162238] text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#121a2d]"
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              {name}
            </button>
          ))}
        </div>

        <Button
          onClick={handleSave}
          size="sm"
          className="h-7 px-3 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono flex items-center gap-1.5"
        >
          {savedNotice ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {savedNotice ? "Saved!" : "Save File"}
        </Button>
      </div>

      {/* Editor Textarea */}
      <div className="flex-1 relative flex overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full p-4 bg-transparent resize-none font-mono text-[13px] leading-relaxed text-slate-200 border-none outline-none focus:ring-0 selection:bg-cyan-500/30"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
