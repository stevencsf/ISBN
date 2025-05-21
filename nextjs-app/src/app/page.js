'use client';

import { useState } from 'react';

export default function LookupPage() {
  const [isbn, setIsbn] = useState('');
  const [bookData, setBookData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBookData(null);

    if (!isbn.trim()) {
      setError('ISBN cannot be empty.');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$|^\d{13}$/.test(isbn.trim())) {
      setError('Invalid ISBN format. Must be 10 or 13 digits.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/isbn/${isbn.trim()}`);
      const data = await response.json(); // Attempt to parse JSON regardless of response.ok

      if (!response.ok) {
        // Use the 'message' if available (especially for our custom redirect error), 
        // then 'error' field, then a generic status error.
        const errorMessage = data.message || data.error || `Error: ${response.status}`;
        const errorDetails = data.location ? ` (Location: ${data.location})` : '';
        setError(`${errorMessage}${errorDetails}`);
      } else {
        setBookData(data);
      }
    } catch (err) {
      console.error('Client-side fetch error:', err);
      // This catch block handles network errors or if response.json() fails
      setError('Failed to fetch book data. Check your network connection or the API may be down.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-50">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">ISBN Lookup</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
              Enter ISBN (10 or 13 digits):
            </label>
            <input
              type="text"
              id="isbn"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g., 0321765723 (10 or 13 digits, no hyphens)"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {loading ? 'Looking up...' : 'Lookup ISBN'}
          </button>
        </form>

        {error && (
          <div id="error-area" className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md whitespace-pre-wrap">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {bookData && (
          <div id="results-area" className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Book Details</h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>Title:</strong> {bookData.title || 'N/A'}</p>
              <p><strong>Authors:</strong> {bookData.authors ? bookData.authors.map(author => author.name || author.key.replace('/authors/', '')).join(', ') : 'N/A'}</p>
              <p><strong>Publish Date:</strong> {bookData.publish_date || (bookData.details && bookData.details.publish_date) || 'N/A'}</p>
              <p><strong>Number of Pages:</strong> {bookData.number_of_pages || (bookData.details && bookData.details.number_of_pages) || 'N/A'}</p>
              <p><strong>Publishers:</strong> {bookData.publishers ? bookData.publishers.join(', ') : (bookData.details && bookData.details.publishers ? bookData.details.publishers.join(', ') : 'N/A')}</p>
              
              {/* Raw data for debugging, can be removed later */}
              {/* <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">View Raw API Response</summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(bookData, null, 2)}
                </pre>
              </details> */}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
