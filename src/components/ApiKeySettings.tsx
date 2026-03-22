import { ShieldCheck, Zap, Image as ImageIcon, Cpu, Key, CheckCircle2, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { getCustomKey, isUsingCustomKey, setCustomAPIKey, switchToDefaultKey, switchToCustomKey } from "@/lib/handwriting/aiHelper";
import { toast } from "sonner";

export function ApiKeySettings() {
  const [customKey, setCustomKeyInput] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    setCustomKeyInput(getCustomKey());
    setUseCustom(isUsingCustomKey());
  }, []);

  const handleSaveKey = () => {
    if (!customKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    setCustomAPIKey(customKey.trim());
    setUseCustom(true);
    toast.success("Custom API key saved successfully!");
  };

  const handleToggleCustom = (checked: boolean) => {
    setUseCustom(checked);
    if (checked) {
      if (customKey.trim()) {
        switchToCustomKey();
        toast.success("Switched to custom API key");
      } else {
        toast.info("Please enter a custom API key first");
        setUseCustom(false);
      }
    } else {
      switchToDefaultKey();
      toast.success("Switched to default API key");
    }
  };

  return (
    <div className="space-y-6 animate-in-up">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">System Intelligence</h3>
            <p className="text-sm text-slate-500 font-medium">Core configuration and AI processing details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Generation Status */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                Active
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Gemini 2.0 Flash</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Powered by Google AI Studio. Provides professional research, detailed bullet points, and high-impact slide structures.
              </p>
            </div>
          </div>

          {/* Visual Asset Management */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                Manual
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">User-Defined Visuals</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Image generation is disabled for maximum control. Upload high-quality assets directly to your slides from your device.
              </p>
            </div>
        </div>
      </div>

      {/* API Key Management */}
        <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Google AI API Key</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Use your own Google AI Studio key (AIzaSy...)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="custom-key-mode" 
                checked={useCustom}
                onCheckedChange={handleToggleCustom}
              />
              <Label htmlFor="custom-key-mode" className="text-sm font-semibold cursor-pointer">
                Use Custom Key
              </Label>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <Label htmlFor="api-key-input" className="text-sm font-semibold text-slate-700">Your Secret Key</Label>
            <div className="flex gap-3">
              <Input
                id="api-key-input"
                type="password"
                placeholder="AIzaSy..."
                value={customKey}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                className="font-mono text-sm bg-slate-50 border-slate-200"
              />
              <Button onClick={handleSaveKey} className="gap-2 font-bold px-6">
                <CheckCircle2 className="w-4 h-4" /> Save
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Your key is stored locally in your browser and never sent to our servers. Only sent directly to Google AI API.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xs text-indigo-700/80 leading-relaxed font-medium">
            Project configuration is locked for consistency. AI text regeneration is available for all slides by simply selecting any text block in the editor.
          </p>
        </div>
      </div>
    </div>
  );
}
