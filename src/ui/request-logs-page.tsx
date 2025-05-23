import React from "react";
import { Layout } from "./layout";
import { PageHeader } from "./page-header";
import { Card, CardContent } from "./library/card";
import { motion } from "framer-motion";
import { app } from "./app";
import type { RequestLogItem } from "../background-app/domain/models/request-log-item";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Hash,
} from "lucide-react";
import { Button } from "./library/button";
import { useInView } from "react-intersection-observer";
import dayjs from "dayjs";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";

function formatMessageContent(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text || "").join("");
  }
  return JSON.stringify(content);
}

function RequestLogCard({
  item,
  onDelete,
}: {
  item: RequestLogItem;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const request = item.request as ChatCompletionCreateParamsNonStreaming;
  const response = item.response as ChatCompletion;
  const requestType = item.type ?? "unknown";

  const totalTokens = response.usage?.total_tokens ?? 0;
  const promptTokens = response.usage?.prompt_tokens ?? 0;
  const completionTokens = response.usage?.completion_tokens ?? 0;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dayjs(item.createdAt).format("MMM DD, YYYY HH:mm:ss")}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <MessageSquare size={12} />
                <span className="capitalize">{requestType}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Hash size={12} />
                <span>{totalTokens} tokens</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 mt-4">
            {/* Request Section */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Request
              </div>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Model:</div>
                  <div className="font-mono">{request.model}</div>
                  <div className="text-gray-500">Temperature:</div>
                  <div className="font-mono">{request.temperature}</div>
                  <div className="text-gray-500">Max Tokens:</div>
                  <div className="font-mono">{request.max_tokens}</div>
                </div>

                <div className="mt-2">
                  <div className="text-gray-500 mb-1">Messages:</div>
                  <div className="space-y-1">
                    {request.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-800 p-2 rounded"
                      >
                        <div className="text-gray-500 mb-1">{msg.role}:</div>
                        <div className="font-mono whitespace-pre-wrap break-words">
                          {formatMessageContent(msg.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Response Section */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Response
              </div>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Model:</div>
                  <div className="font-mono">{response.model}</div>
                  <div className="text-gray-500">Created:</div>
                  <div className="font-mono">
                    {dayjs.unix(response.created).format("HH:mm:ss")}
                  </div>
                  <div className="text-gray-500">Total Tokens:</div>
                  <div className="font-mono">{totalTokens}</div>
                  <div className="text-gray-500">Prompt Tokens:</div>
                  <div className="font-mono">{promptTokens}</div>
                  <div className="text-gray-500">Completion Tokens:</div>
                  <div className="font-mono">{completionTokens}</div>
                </div>

                <div className="mt-2">
                  <div className="text-gray-500 mb-1">Content:</div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="font-mono whitespace-pre-wrap break-words">
                      {formatMessageContent(
                        response.choices[0]?.message?.content
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
