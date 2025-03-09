/**
 * Giphy API client for fetching GIFs based on search terms
 */

// We'll use the Giphy API to fetch GIFs
// The user will need to get a Giphy API key from https://developers.giphy.com/
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

interface GiphySearchResult {
  data: {
    id: string;
    url: string;
    images: {
      original: {
        url: string;
        width: string;
        height: string;
      };
      downsized: {
        url: string;
        width: string;
        height: string;
      };
    };
  }[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

/**
 * Search for GIFs on Giphy
 * @param query Search query
 * @param limit Maximum number of results to return
 * @returns Array of GIF URLs
 */
export async function searchGifs(query: string, limit: number = 5): Promise<string[]> {
  if (!GIPHY_API_KEY) {
    console.error('GIPHY_API_KEY environment variable is not set');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
        query
      )}&limit=${limit}&rating=g`
    );

    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
    }

    const data: GiphySearchResult = await response.json();
    
    // Return the URLs of the GIFs
    return data.data.map((gif) => gif.images.downsized.url);
  } catch (error) {
    console.error('Error searching Giphy:', error);
    return [];
  }
}

/**
 * Get a random GIF from Giphy based on a search term
 * @param query Search query
 * @returns URL of a random GIF, or null if none found
 */
export async function getRandomGif(query: string): Promise<string | null> {
  console.log(`Getting random GIF for query: "${query}"`);
  
  if (!query || query.trim() === '') {
    console.log('Empty query provided, using fallback query: "thumbs up"');
    query = 'thumbs up';
  }
  
  try {
    const gifs = await searchGifs(query, 10);
    console.log(`Found ${gifs.length} GIFs for query "${query}"`);
    
    if (gifs.length === 0) {
      console.log('No GIFs found, trying fallback query: "reaction"');
      const fallbackGifs = await searchGifs('reaction', 10);
      
      if (fallbackGifs.length === 0) {
        console.log('No GIFs found for fallback query either, returning null');
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * fallbackGifs.length);
      console.log(`Using fallback GIF at index ${randomIndex}`);
      return fallbackGifs[randomIndex];
    }
    
    // Return a random GIF from the results
    const randomIndex = Math.floor(Math.random() * gifs.length);
    console.log(`Selected GIF at index ${randomIndex}`);
    return gifs[randomIndex];
  } catch (error) {
    console.error('Error getting random GIF:', error);
    return null;
  }
}