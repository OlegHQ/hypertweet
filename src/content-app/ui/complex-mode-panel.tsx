import { ThreadTask } from "src/background-app/ai/thread-tasks";
import MiniActionButtonsGrid from "./mini-action-buttons-grid";

export default function ComplexModePanel() {
  const handleCopyThread = async (task: ThreadTask) => {
    // TODO: Implement complex mode thread copying
    console.log("Complex mode thread copy:", task);
  };

  return (
    <div className="space-y-4 px-4">
      <MiniActionButtonsGrid onCopyThread={handleCopyThread} />
    </div>
  );
}
