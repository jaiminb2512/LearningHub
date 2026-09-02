/**
 * Fetches the page title and author/organization from a given URL
 * Note: This will only work for URLs that allow CORS requests
 * For better reliability, consider using a backend endpoint
 * 
 * @param {string} url - The URL to fetch the title from
 * @returns {Promise<{title: string, author: string|null}>} - The page title and author/organization
 */
export async function getPageTitle(url) {
    try {
        // Validate URL
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL provided');
        }

        // Ensure URL has a protocol
        let validUrl = url.trim();
        if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
            validUrl = 'https://' + validUrl;
        }

        // Fetch the HTML content
        const response = await fetch(validUrl, {
            method: 'GET',
            mode: 'cors', // This will fail for sites that don't allow CORS
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        // Parse HTML using DOMParser (browser-compatible)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get title from various possible locations
        let title = doc.querySelector('title')?.textContent?.trim();
        
        // Fallback to meta tags if title is not found
        if (!title) {
            title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
        }
        
        if (!title) {
            title = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim();
        }

        if (!title) {
            throw new Error('Title not found on the page');
        }

        // Get author/organization from various possible locations
        let author = null;
        
        // Try different meta tags for author/organization
        author = doc.querySelector('meta[name="author"]')?.getAttribute('content')?.trim();
        
        if (!author) {
            author = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim();
        }
        
        if (!author) {
            author = doc.querySelector('meta[property="article:author"]')?.getAttribute('content')?.trim();
        }
        
        if (!author) {
            author = doc.querySelector('meta[name="twitter:site"]')?.getAttribute('content')?.trim();
        }
        
        if (!author) {
            author = doc.querySelector('meta[property="og:publisher"]')?.getAttribute('content')?.trim();
        }
        
        if (!author) {
            // Try to extract from URL domain as fallback
            try {
                const urlObj = new URL(validUrl);
                author = urlObj.hostname.replace('www.', '').split('.')[0];
                // Capitalize first letter
                author = author.charAt(0).toUpperCase() + author.slice(1);
            } catch (e) {
                // If URL parsing fails, leave author as null
            }
        }

        return { title, author };
    } catch (error) {
        console.error('Error fetching page title:', error);
        throw error;
    }
}

