import { useGlobalState } from "../state";

interface PageHeaderProps {
  title: string;
  backRoute: string;
}

export function PageHeader({ title, backRoute }: PageHeaderProps) {
  const { setCurrentRoute } = useGlobalState();

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => setCurrentRoute(backRoute)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Go back"
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
      <h1 className="text-xl font-medium">{title}</h1>
    </div>
  );
} 