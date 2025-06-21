import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash' 
});

// CORS proxy function
function fetchWithProxy(url: string, params: RequestInit = {}) {
  return fetch(`https://proxy.cors.sh/${url}`, {
    ...params,
    headers: {
      ...params.headers,
      'x-cors-api-key': 'temp_694cce4a5a758e2a74f2022a1fcf3238'
    }
  });
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  metadata: {
    scrapedAt: string;
    wordCount: number;
    domain: string;
  };
}

export const scrapeWebsite = async (url: string): Promise<ScrapedContent> => {
  try {
    // Use the cors.sh proxy instead of allorigins
    const response = await fetchWithProxy(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const htmlContent = await response.text();
    
    // Parse HTML content (basic text extraction)
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style, nav, footer, header');
    scripts.forEach(element => element.remove());
    
    // Extract title
    const title = doc.querySelector('title')?.textContent || 'No title found';
    
    // Extract main content
    const bodyText = doc.body?.textContent || '';
    const cleanedText = bodyText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    // Extract links
    const links = Array.from(doc.querySelectorAll('a[href]'))
      .map(a => (a as HTMLAnchorElement).href)
      .filter(href => href.startsWith('http'))
      .slice(0, 20); // Limit to first 20 links

    // Generate AI summary and key points using Gemini
    const aiPrompt = `
      Analyze the following website content and extract key information for business/sales/marketing context:

      Website URL: ${url}
      Title: ${title}
      Content extracted: ${cleanedText.substring(0, 16000)}
      Links extracted: ${links.join('\n')}

      Please provide:
      1. A concise summary (2-3 sentences) of what this website/company is about
      2. Key business information, products, services, or opportunities
      3. Important details that would be useful for sales/marketing outreach
      4. Any contact information, pricing, or competitive advantages mentioned

      IMPORTANT: Respond ONLY with valid JSON. Do not include markdown code blocks or any other text. Use this exact format:
      {"summary": "Brief 5-10 sentence summary", "keyPoints": ["Key point 1", "Key point 2", "Key point 3"], "businessContext": "Additional context for sales/marketing use"}
    `;

    const result = await geminiModel.generateContent(aiPrompt);
    let aiResponse = result.response.text().trim();
    
    // Clean up the response - remove any markdown code blocks or extra text
    if (aiResponse.includes('```json')) {
      const jsonStart = aiResponse.indexOf('```json') + 7;
      const jsonEnd = aiResponse.indexOf('```', jsonStart);
      if (jsonEnd !== -1) {
        aiResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
      }
    } else if (aiResponse.includes('```')) {
      const jsonStart = aiResponse.indexOf('```') + 3;
      const jsonEnd = aiResponse.indexOf('```', jsonStart);
      if (jsonEnd !== -1) {
        aiResponse = aiResponse.substring(jsonStart, jsonEnd).trim();
      }
    }
    
    let parsedAI;
    try {
      parsedAI = JSON.parse(aiResponse);
      
      // Validate that required fields exist
      if (!parsedAI.summary || !Array.isArray(parsedAI.keyPoints)) {
        throw new Error('Invalid AI response structure');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI Response:', aiResponse);
      
      // Enhanced fallback - try to extract useful information even if JSON parsing fails
      const fallbackSummary = aiResponse.length > 50 
        ? aiResponse.substring(0, 500) + '...'
        : `Professional profile/website at ${new URL(url).hostname}. This URL contains business information that may be useful for sales and marketing outreach.`;
      
      parsedAI = {
        summary: fallbackSummary,
        keyPoints: ['Website content analyzed - see summary for details'],
        businessContext: 'Manual review recommended for complete context'
      };
    }

    const scrapedContent: ScrapedContent = {
      url,
      title,
      content: cleanedText.substring(0, 5000), // Limit stored content
      summary: parsedAI.summary || 'Summary not available',
      keyPoints: parsedAI.keyPoints || [],
      metadata: {
        scrapedAt: new Date().toISOString(),
        wordCount: cleanedText.split(' ').length,
        domain: new URL(url).hostname
      }
    };

    return scrapedContent;

  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateContextSummary = async (projectData: {
  name: string;
  description: string;
  leadSource: string;
  contextFiles: any[];
}): Promise<string> => {
  try {
    // Prepare detailed context information
    let contextDetails = '';
    
    projectData.contextFiles.forEach((file, index) => {
      contextDetails += `\n${index + 1}. ${file.name} (${file.type}):`;
      
      if (file.type === 'url' && file.scrapedData) {
        const scraped = file.scrapedData;
        contextDetails += `
   - Website: ${scraped.url} (${scraped.metadata.domain})
   - Title: ${scraped.title}
   - Summary: ${scraped.summary}
   - Key Points: ${scraped.keyPoints.join(', ')}
   - Word Count: ${scraped.metadata.wordCount}`;
      } else if (file.type === 'text') {
        const preview = file.content.length > 200 
          ? file.content.substring(0, 200) + '...'
          : file.content;
        contextDetails += `\n   - Content Preview: ${preview}`;
      } else {
        contextDetails += `\n   - File: ${file.name}`;
      }
    });

    const prompt = `
      Create a comprehensive context summary for this sales/marketing project:

      Project Name: ${projectData.name}
      Description: ${projectData.description}
      Lead Source: ${projectData.leadSource}
      
      Context Files Added: ${projectData.contextFiles.length} items
      ${contextDetails}

      Generate a concise but comprehensive summary that captures:
      1. The project's main objective and target
      2. Key insights from scraped websites (business type, services, opportunities)
      3. Important context from uploaded files and text content
      4. Strategic insights and recommendations for AI-powered sales/marketing tools
      5. Any competitive advantages, pain points, or opportunities identified

      Focus especially on actionable insights from website analysis and business intelligence.
      Keep it under 500 words but make it rich with specific, actionable information.
    `;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error('Error generating context summary:', error);
    
    // Enhanced fallback that includes scraped data if available
    let fallbackSummary = `Project: ${projectData.name}. Description: ${projectData.description}. Lead Source: ${projectData.leadSource}. Context files: ${projectData.contextFiles.length} items.`;
    
    // Try to include scraped website info in fallback
    const urlFiles = projectData.contextFiles.filter(f => f.type === 'url' && f.scrapedData);
    if (urlFiles.length > 0) {
      fallbackSummary += '\n\nWebsites analyzed:';
      urlFiles.forEach(file => {
        fallbackSummary += `\n- ${file.scrapedData.title} (${file.scrapedData.metadata.domain}): ${file.scrapedData.summary.substring(0, 100)}...`;
      });
    }
    
    return fallbackSummary;
  }
}; 