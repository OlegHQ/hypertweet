import { Layout } from "./layout";
import { useGlobalState } from "./state";

export default function HomePage() {
  const { setCurrentRoute } = useGlobalState();

  return (
    <Layout>
      <div className="space-y-4">
        <div
          className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => setCurrentRoute("/reply-types")}
        >
          <h2 className="text-lg font-medium mb-2">Reply Types</h2>
          <p className="text-gray-600">
            Configure and manage your reply types to enhance the AI's
            understanding of your expertise and preferences.
          </p>
        </div>
        <div
          className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => setCurrentRoute("/knowledge-base")}
        >
          <h2 className="text-lg font-medium mb-2">Knowledge Base</h2>
          <p className="text-gray-600">
            Configure and manage your knowledge base to enhance the AI's
            understanding of your expertise and preferences.
          </p>
        </div>
      </div>
    </Layout>
  );
}
