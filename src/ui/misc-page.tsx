import { Layout } from "./layout";
import ApiConfig from "./api-config";
import { PageHeader } from "./page-header";
import { useGlobalState } from "./state";
import { app } from "./app";

export default function MiscPage() {
  const { setCurrentRoute, selectedProfile } = useGlobalState();

  const handleCopyTweetJson = async () => {
    const data = await app.content.getCurrentTweetThreadJSON(
      selectedProfile?.id ?? ""
    );
    if (!data) {
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  return (
    <Layout>
      <PageHeader title="Miscellaneous" backRoute="/" />
      <div className="space-y-6 p-4">
        <ApiConfig />
        <div
          onClick={() => setCurrentRoute("/data-backup")}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Data Backup & Restore</h2>
          <p className="text-gray-600">
            Create backups of your data including profiles, settings, and reply
            types. You can also restore your data from a previous backup file.
          </p>
        </div>
        <div
          onClick={handleCopyTweetJson}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Copy X Thread JSON</h2>
          <p className="text-gray-600">
            When you're on an X (Twitter) thread page, click this button to copy
            a formatted JSON with the thread ID and URL. This makes it easy to
            share thread context with ChatGPT for analysis or response
            generation.
          </p>
        </div>
      </div>
    </Layout>
  );
}
