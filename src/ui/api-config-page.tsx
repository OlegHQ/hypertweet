import { Layout } from "./layout";
import ApiConfig from "./api-config";
import { PageHeader } from "./page-header";
import { useGlobalState } from "./state";

export default function ApiConfigPage() {
  const { setCurrentRoute } = useGlobalState();

  return (
    <Layout>
      <PageHeader title="API Config" backRoute="/" />
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
      </div>
    </Layout>
  );
}
