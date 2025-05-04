import { useEffect } from "react";
import { Layout } from "./layout";
import { useGlobalState } from "./state";
import { app } from "./app";

export default function ReplyTypesPage() {
  const {
    setCurrentRoute,
    selectedProfile,
    replyTypes,
    setReplyTypes,
    getReplyTypes,
  } = useGlobalState();

  useEffect(() => {
    async function fetchReplyTypes() {
      if (!selectedProfile) return;
      const currentReplyTypes = getReplyTypes(selectedProfile.id);
      if (currentReplyTypes === undefined) {
        const types = await app.replyTypes.getAll(selectedProfile.id);
        setReplyTypes(selectedProfile.id, types);
      }
    }
    fetchReplyTypes();
  }, [selectedProfile, getReplyTypes, setReplyTypes]);

  const currentReplyTypes = selectedProfile
    ? getReplyTypes(selectedProfile.id)
    : undefined;
  const systemReplyTypes =
    currentReplyTypes?.filter((type) => type.isSystem) ?? [];
  const userReplyTypes =
    currentReplyTypes?.filter((type) => !type.isSystem) ?? [];

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setCurrentRoute("/")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Go back to home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h1>Reply Types</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-medium mb-4">Your Reply Types</h2>
          {userReplyTypes.length === 0 ? (
            <div className="text-gray-500 italic">
              No custom reply types created yet
            </div>
          ) : (
            <div className="grid gap-4">
              {userReplyTypes.map((type) => (
                <div key={type.id} className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-medium">{type.name}</h3>
                  <p className="text-gray-600 mt-1">{type.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">System Reply Types</h2>
          {systemReplyTypes.length === 0 ? (
            <div className="text-gray-500 italic">
              No system reply types available
            </div>
          ) : (
            <div className="grid gap-4">
              {systemReplyTypes.map((type) => (
                <div key={type.id} className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-medium">{type.name}</h3>
                  <p className="text-gray-600 mt-1">{type.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
