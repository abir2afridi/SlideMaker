import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Create from "./pages/Create.tsx";
import Editor from "./pages/Editor.tsx";
import Templates from "./pages/Templates.tsx";
import Analytics from "./pages/Analytics.tsx";
import Share from "./pages/Share.tsx";
import Settings from "./pages/Settings.tsx";

// Handwriting Features
import HandwritingLanding from "./pages/handwriting/LandingPage.tsx";
import HandwritingEditor from "./pages/handwriting/EditorPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HandwritingLanding />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/create" element={<Create />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/share/:token" element={<Share />} />
          <Route path="/settings" element={<Settings />} />

          {/* Handwriting Flow Routes - Consolidated into EditorPage */}
          <Route path="/editor-handwriting" element={<HandwritingEditor />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
