import { ThreadTask } from "src/background-app/ai/thread-tasks";
import MiniActionButtonsGrid from "./mini-action-buttons-grid";
import { bgApp } from "../bg-app";
import { useLastUsedProfileId } from "./use-last-used-profile-id";

export default function ComplexModePanel() {
  const lastUsedProfileId = useLastUsedProfileId();
  const handleCopyThread = async (task: ThreadTask) => {
    if (!lastUsedProfileId) {
      return;
    }

    const result = await bgApp.content.generateComplex(lastUsedProfileId, task);

    console.log({ result });
  };

  return (
    <div className="space-y-4 px-4">
      <MiniActionButtonsGrid onCopyThread={handleCopyThread} />
    </div>
  );
}
