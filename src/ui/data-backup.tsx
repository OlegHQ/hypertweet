import React, { useState } from "react";
import { app } from "./app";
import { PageHeader } from "./page-header";
import { Card, CardContent } from "./library/card";
import { Button } from "./library/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Database,
} from "lucide-react";
import { cn } from "./library/utils";

export default function DataBackup() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsExporting(true);
      await app.backup.exportData();
      setSuccess("Backup file has been downloaded successfully!");
    } catch (err) {
      setError(
        "Failed to export backup: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(null);
      setIsImporting(true);

      const text = await file.text();
      await app.backup.importData(text);
      setSuccess("Backup has been imported successfully!");
    } catch (err) {
      setError(
        "Failed to import backup: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = "";
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Data Backup" backRoute="/" />

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Download className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Export Data
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      Create a backup of your data including profiles, settings,
                      and reply types. This will download a JSON file containing
                      all your data.
                    </p>
                    <div className="mt-4">
                      <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2"
                      >
                        <Download
                          className={cn(
                            "h-4 w-4",
                            isExporting && "animate-bounce"
                          )}
                        />
                        {isExporting ? "Exporting..." : "Download Backup"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Import Data
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      Restore your data from a previous backup file. This will
                      replace all current data. Make sure to backup your current
                      data first.
                    </p>
                    <div className="mt-4">
                      <label className="block">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                          id="backup-file"
                        />
                        <Button
                          onClick={() =>
                            document.getElementById("backup-file")?.click()
                          }
                          disabled={isImporting}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Upload
                            className={cn(
                              "h-4 w-4",
                              isImporting && "animate-bounce"
                            )}
                          />
                          {isImporting ? "Importing..." : "Choose Backup File"}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 dark:text-green-300">
                    {success}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
