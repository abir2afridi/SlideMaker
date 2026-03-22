import { ApiKeySettings } from "../components/ApiKeySettings";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 
        text-gray-900 dark:text-white">
        Settings
      </h1>
      <ApiKeySettings />
    </div>
  );
}
