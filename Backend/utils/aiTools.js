import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

export const internetSearchTool = new DuckDuckGoSearch({
    maxResults: 5,
});

internetSearchTool.name = "internet_search";
internetSearchTool.description = `
Search the internet for the latest information.
Use this tool whenever the user asks about:
- latest news
- current events
- recent announcements
- today's updates
- trending topics
- information after your knowledge cutoff

Never answer recent-news questions without using this tool first.
`;