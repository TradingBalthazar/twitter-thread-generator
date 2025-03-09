import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [monitorResult, setMonitorResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test");
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: "Failed to run test" });
    } finally {
      setLoading(false);
    }
  };

  const runMonitor = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/twitter/monitor", {
        method: "POST",
      });
      const data = await response.json();
      setMonitorResult(data);
    } catch (error) {
      setMonitorResult({ error: "Failed to run monitor" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>

      <div className="grid gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runTest} disabled={loading}>
              {loading ? "Running..." : "Run Test"}
            </Button>

            {testResult && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Monitor API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runMonitor} disabled={loading}>
              {loading ? "Running..." : "Run Monitor API"}
            </Button>

            {monitorResult && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Monitor Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(monitorResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}