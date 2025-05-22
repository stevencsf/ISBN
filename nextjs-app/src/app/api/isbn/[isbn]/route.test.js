import { GET } from './route'; // Adjust path as necessary
import { NextResponse } from 'next/server';

// Mock global fetch
global.fetch = jest.fn();

// Helper to mock NextResponse.json to make it easier to assert its arguments
// We can also just inspect the result of GET(...).json()
// For now, let's directly inspect the response from GET

describe('API Route: /api/isbn/[isbn]', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    fetch.mockClear();
  });

  describe('GET Handler', () => {
    it('should return 200 with book data for a valid ISBN and successful API call', async () => {
      const mockIsbn = '9780321765723';
      const mockBookData = { title: 'The C++ Programming Language', authors: [{ name: 'Bjarne Stroustrup' }] };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBookData,
        text: async () => JSON.stringify(mockBookData), // Added text mock
      });

      const request = {}; // Mock Request object if needed by the handler, not used in current GET
      const params = { params: { isbn: mockIsbn } };
      
      const response = await GET(request, params);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockBookData);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`https://openlibrary.org/isbn/${mockIsbn}.json`);
    });

    it('should return 404 if ISBN is not found on Open Library', async () => {
      const mockIsbn = '0000000000';
      fetch.mockResolvedValueOnce({
        ok: false, // Or true, depending on how OpenLibrary returns "not found" that isn't a redirect
        status: 404,
        json: async () => ({ error: 'notfound' }), // Simulate OpenLibrary's error or empty object
        text: async () => JSON.stringify({ error: 'notfound' }),
      });

      const request = {};
      const params = { params: { isbn: mockIsbn } };
      const response = await GET(request, params);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain('not found');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    it('should return 404 if Open Library returns an empty object (another way of not found)', async () => {
        const mockIsbn = '1111111111';
        fetch.mockResolvedValueOnce({
          ok: true, // OpenLibrary might return 200 OK with an empty JSON object
          status: 200,
          json: async () => ({}),
          text: async () => JSON.stringify({}),
        });
  
        const request = {};
        const params = { params: { isbn: mockIsbn } };
        const response = await GET(request, params);
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toContain('not found or no data available');
        expect(fetch).toHaveBeenCalledTimes(1);
      });

    it('should return 400 for an invalid ISBN format (too short)', async () => {
      const mockIsbn = '123';
      const request = {};
      const params = { params: { isbn: mockIsbn } };
      
      const response = await GET(request, params);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid ISBN format');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid ISBN format (contains letters)', async () => {
        const mockIsbn = 'abcdefghij';
        const request = {};
        const params = { params: { isbn: mockIsbn } };
        
        const response = await GET(request, params);
        const body = await response.json();
  
        expect(response.status).toBe(400);
        expect(body.error).toContain('Invalid ISBN format');
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should return 500 if Open Library API call fails (e.g., server error)', async () => {
      const mockIsbn = '9780321765723';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'server error' }), // OL might not return JSON on 500
        text: async () => 'Internal Server Error',
      });

      const request = {};
      const params = { params: { isbn: mockIsbn } };
      const response = await GET(request, params);
      const body = await response.json();
      
      // The API route returns the status from OpenLibrary directly in this case
      expect(response.status).toBe(500); 
      expect(body.error).toContain('Open Library API error: Internal Server Error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    it('should return 500 if fetch itself throws an error (network issue)', async () => {
        const mockIsbn = '9780321765723';
        fetch.mockRejectedValueOnce(new Error('Network failed'));
  
        const request = {};
        const params = { params: { isbn: mockIsbn } };
        const response = await GET(request, params);
        const body = await response.json();
  
        expect(response.status).toBe(500);
        expect(body.error).toContain('Failed to fetch data from Open Library API');
        expect(fetch).toHaveBeenCalledTimes(1);
      });

    it('should return 404 with redirect information if Open Library indicates a redirect', async () => {
      const mockIsbn = '9780123456789'; // An ISBN that gets redirected
      const redirectData = {
        type: { key: '/type/redirect' },
        location: '/books/OL12345M',
        // ... other fields OpenLibrary might send
      };
      fetch.mockResolvedValueOnce({
        ok: true, // Redirects often come with a 200 OK from OL, then data indicates the redirect
        status: 200,
        json: async () => redirectData,
        text: async () => JSON.stringify(redirectData),
      });

      const request = {};
      const params = { params: { isbn: mockIsbn } };
      const response = await GET(request, params);
      const body = await response.json();

      expect(response.status).toBe(404); // As per our API logic
      expect(body.error).toBe('ISBN Redirected');
      expect(body.message).toContain('has been redirected');
      expect(body.location).toBe('/books/OL12345M');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if Open Library returns non-JSON response when JSON is expected', async () => {
        const mockIsbn = '9780321765723';
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => { throw new Error('Invalid JSON'); }, // Simulate parsing error
          text: async () => 'This is not JSON', // Actual text response
        });
  
        const request = {};
        const params = { params: { isbn: mockIsbn } };
        const response = await GET(request, params);
        const body = await response.json();
  
        expect(response.status).toBe(500);
        expect(body.error).toContain('Failed to parse JSON response');
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      it('should return 500 if Open Library returns an empty string response', async () => {
        const mockIsbn = '9780321765723';
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => { throw new Error('Cannot parse empty string')}, // This would likely happen
          text: async () => '', // Empty string response
        });
  
        const request = {};
        const params = { params: { isbn: mockIsbn } };
        const response = await GET(request, params);
        const body = await response.json();
  
        expect(response.status).toBe(500);
        expect(body.error).toContain('Empty response from Open Library API');
        expect(fetch).toHaveBeenCalledTimes(1);
      });
  });
});
