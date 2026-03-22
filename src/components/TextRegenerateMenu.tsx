import { useState, useEffect, useRef } from "react";
import { regenerateSelectedText } from "@/lib/api";

interface Props {
  slideHeading: string;
  slideContext: string;
  onReplace: (newText: string) => void;
}

export function TextRegenerateMenu({
  slideHeading,
  slideContext,
  onReplace,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [textType, setTextType] = useState<"bullet" | "heading" | "description">("bullet");
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to ensure selection is populated
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 3) {
          setSelectedText(text);
          // Try to position near the selection
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          
          if (rect) {
            setPosition({
              x: Math.min(rect.left, window.innerWidth - 300),
              y: rect.bottom + window.scrollY + 10,
            });
          } else {
            setPosition({
              x: Math.min(e.clientX, window.innerWidth - 300),
              y: e.clientY + 10,
            });
          }
          setVisible(true);
        }
      }, 10);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length <= 3) {
        // We don't hide immediately to allow clicking the menu
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRegenerate = async () => {
    if (!selectedText) return;
    setLoading(true);

    try {
      const improvedText = await regenerateSelectedText(
        selectedText,
        textType,
        slideHeading,
        slideContext,
        instruction || "improve and make more informative"
      );

      onReplace(improvedText);
      setVisible(false);
      setInstruction("");

    } catch (err) {
      console.error("Failed:", err);
      alert("Regeneration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        zIndex: 9999,
      }}
      className="bg-white dark:bg-slate-900 border border-slate-200 
        dark:border-slate-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] p-4 w-72 animate-in-fast"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="text-sm">✨</span>
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          AI Text Editor
        </span>
        <button
          onClick={() => setVisible(false)}
          className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="text-xl leading-none">×</span>
        </button>
      </div>

      {/* Selected text preview */}
      <div className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 
        rounded-lg border border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Original</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 
          line-clamp-2 italic font-content">
          "{selectedText}"
        </p>
      </div>

      {/* Text type selector */}
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Refinement Type</p>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
          {(["bullet", "heading", "description"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTextType(type)}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md capitalize
                transition-all ${
                textType === type
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Optional instruction */}
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Custom Instruction</p>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. make it more professional..."
          className="w-full px-3 py-2 text-xs border border-slate-200 
            dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 
            text-slate-900 dark:text-white placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-primary/20 
            focus:border-primary transition-all"
        />
      </div>

      {/* Quick instruction buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[
          "Shorter",
          "Detailed",
          "Add Examples",
          "Simplify",
        ].map((quick) => (
          <button
            key={quick}
            onClick={() => setInstruction(quick)}
            className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-800
              text-slate-600 dark:text-slate-400 rounded-lg
              border border-slate-200 dark:border-slate-800
              hover:border-primary/30 hover:text-primary transition-all"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* Regenerate button */}
      <button
        onClick={handleRegenerate}
        disabled={loading}
        className="w-full py-2.5 bg-hero-gradient hover:opacity-90
          disabled:opacity-50 disabled:cursor-not-allowed
          text-white text-xs rounded-lg font-bold 
          transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
      >
        {loading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 
              border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <span>Rewrite Content</span>
            <span className="text-sm">✨</span>
          </>
        )}
      </button>
    </div>
  );
}
