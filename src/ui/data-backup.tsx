import React, { useState } from "react";
import { app } from "./app";
import { PageHeader } from "./page-header";

export default function DataBackup() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setError(null);
      setSuccess(null);
      await app.backup.exportData();
      setSuccess("Backup file has been downloaded successfully!");
    } catch (err) {
      setError(
        "Failed to export backup: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(null);
      await app.backup.importData(file);
      setSuccess("Backup has been imported successfully!");
    } catch (err) {
      setError(
        "Failed to import backup: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      // Reset the file input
      event.target.value = "";
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="max-w-2xl mx-auto p-6">
          <PageHeader title="Data Backup" backRoute="/" />

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Export Data</h2>
              <p className="text-gray-600 mb-4">
                Create a backup of your data including profiles, settings, and
                reply types.
              </p>
              <button
                onClick={handleExport}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Download Backup
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Import Data</h2>
              <p className="text-gray-600 mb-4">
                Restore your data from a previous backup file. This will replace
                all current data.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="backup-file"
                />
                <button
                  onClick={() =>
                    document.getElementById("backup-file")?.click()
                  }
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Choose Backup File
                </button>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
