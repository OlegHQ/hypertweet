import React from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { Card, CardContent } from "./library/card";
import { motion } from "framer-motion";
import { app } from "./app";
import type { RequestLogItem } from "../background-app/domain/models/request-log-item";
import { Trash2 } from "lucide-react";
import { Button } from "./library/button";
import { useInView } from "react-intersection-observer";
import dayjs from "dayjs";

function RequestLogCard({
  item,
  onDelete,
}: {
  item: RequestLogItem;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {dayjs(item.createdAt).format("MMM DD, YYYY HH:mm:ss")}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Request:
            </div>
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(item.request, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Response:
            </div>
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(item.response, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RequestLogsPage() {
  const [logs, setLogs] = React.useState<RequestLogItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [cursor, setCursor] = React.useState<Date | undefined>();
  const { ref, inView } = useInView();

  const loadLogs = React.useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await app.dataLayer.requestLog.getLastLogs(10, cursor);
      setLogs((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore]);

  React.useEffect(() => {
    if (inView) {
      loadLogs();
    }
  }, [inView, loadLogs]);

  const handleDelete = async (id: string) => {
    try {
      await app.dataLayer.requestLog.delete(id);
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  return (
    <Layout>
      <PageHeader title="Request Logs" backRoute="/misc" />
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {logs.map((log) => (
            <RequestLogCard key={log.id} item={log} onDelete={handleDelete} />
          ))}

          {/* Loading indicator and infinite scroll trigger */}
          <div ref={ref} className="h-10 flex items-center justify-center">
            {loading && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
