'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Loader2, FileText, Search } from 'lucide-react';

export default function TestDocumentsPage() {
  const [fileId, setFileId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const verifyFile = async () => {
    if (!fileId.trim()) {
      alert('Please enter a file ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/documents/verify-openai?fileId=${encodeURIComponent(fileId)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to verify file',
      });
    } finally {
      setLoading(false);
    }
  };

  const listAllFiles = async () => {
    setListLoading(true);
    setAllFiles([]);

    try {
      const response = await fetch('/api/documents/verify-openai', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setAllFiles(data.files || []);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to list files');
    } finally {
      setListLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document OpenAI Verification</h1>
          <p className="text-gray-600 mt-2">
            Test and verify that documents are being uploaded to OpenAI
          </p>
        </div>

        {/* Verify Single File */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Verify Single File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI File ID
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="file-xxxxxxxxxxxxx"
                  value={fileId}
                  onChange={(e) => setFileId(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={verifyFile} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the OpenAI file ID from the console logs (starts with "file-")
              </p>
            </div>

            {result && (
              <div className={`p-4 rounded-lg border ${
                result.exists 
                  ? 'bg-green-50 border-green-200' 
                  : result.success 
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {result.exists ? (
                      <>
                        <h3 className="font-semibold text-green-900 mb-2">
                          ✅ File Found in OpenAI!
                        </h3>
                        <div className="space-y-1 text-sm text-green-800">
                          <p><strong>ID:</strong> {result.file.id}</p>
                          <p><strong>Filename:</strong> {result.file.filename}</p>
                          <p><strong>Size:</strong> {result.file.sizeMB} MB ({result.file.sizeKB} KB)</p>
                          <p><strong>Purpose:</strong> {result.file.purpose}</p>
                          <p><strong>Status:</strong> {result.file.status}</p>
                          <p><strong>Created:</strong> {result.file.createdDate}</p>
                        </div>
                      </>
                    ) : result.success ? (
                      <>
                        <h3 className="font-semibold text-yellow-900 mb-2">
                          ⚠️ File Not Found
                        </h3>
                        <p className="text-sm text-yellow-800">
                          {result.message || 'This file does not exist in OpenAI'}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-red-900 mb-2">
                          ❌ Error
                        </h3>
                        <p className="text-sm text-red-800">
                          {result.error}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* List All Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Files in OpenAI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button onClick={listAllFiles} disabled={listLoading}>
                {listLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    List All Files
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                This will show all files uploaded to OpenAI with purpose "assistants"
              </p>
            </div>

            {allFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  Found {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            {file.id}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                            <span>{file.sizeMB} MB</span>
                            <span>•</span>
                            <span>{file.status}</span>
                            <span>•</span>
                            <span>{new Date(file.createdDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFileId(file.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allFiles.length === 0 && !listLoading && (
              <p className="text-sm text-gray-500 italic">
                No files loaded yet. Click "List All Files" to see uploaded documents.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-1">Method 1: Check Console Logs</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Upload a document through the brand profile wizard</li>
                <li>Open browser console (F12)</li>
                <li>Look for: <code className="bg-gray-100 px-1 rounded">📎 OpenAI File ID: file-xxxxx</code></li>
                <li>Copy the file ID and paste it above to verify</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Method 2: List All Files</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click "List All Files" button above</li>
                <li>See all documents uploaded to OpenAI</li>
                <li>Click "Verify" on any file to see details</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Method 3: Check OpenAI Dashboard</h4>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://platform.openai.com/storage/files" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Files Dashboard</a></li>
                <li>Look for files with purpose "assistants"</li>
                <li>Verify your uploaded documents are there</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

