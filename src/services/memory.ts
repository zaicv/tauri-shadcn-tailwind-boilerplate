// services/memory.ts
export interface Memory {
    id: string;
    similarity?: number;
    name: string;
    content: string;
    importance: number;
    created_at: string;
  }
  
  export interface ParsedMemory {
    id: string;
    similarity: number;
    name: string;
    content: string;
    importance: number;
    created_at: string;
  }
  
  /**
   * Parse memory blocks returned from the backend into structured memory objects
   * Handles lines like "• (0.85) Memory Name: Memory content"
   */
  export const parseMemoryBlock = (memoryBlock: string): ParsedMemory[] => {
    const memories: ParsedMemory[] = [];
    const lines = memoryBlock.split("\n");
  
    for (const line of lines) {
      if (line.startsWith("•")) {
        // Parse lines like "• (0.85) Memory Name: Memory content"
        const match = line.match(/•\s*\(([\d.]+)\)\s*(.+?):\s*(.+)/);
        if (match) {
          memories.push({
            id: `memory-${Date.now()}-${Math.random()}`,
            similarity: parseFloat(match[1]),
            name: match[2].trim(),
            content: match[3].trim(),
            importance: Math.floor(Math.random() * 10) + 1, // Mock importance for now
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  
    return memories;
  };
  
  /**
   * Retrieve memories from the backend based on a search query
   */
  export const retrieveMemories = async (
    query: string,
    options: { deepMemory?: boolean } = {}
  ): Promise<Memory[]> => {
    const payload: Record<string, any> = { query };
    if (typeof options.deepMemory === "boolean") {
      payload.deepMemory = options.deepMemory;
    }
    try {
      const res = await fetch(
        "https://100.83.147.76:8003/api/retrieve-memories",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
  
      if (!res.ok) throw new Error(await res.text());
  
      const data = await res.json();
      return data.memories || [];
    } catch (err) {
      console.error("Failed to retrieve memories:", err);
      throw err;
    }
  };
  
  /**
   * Add a new memory to the backend
   */
  export const addMemory = async (memoryData: {
    name: string;
    content: string;
    tags: string[];
    importance: number;
    persona_id?: string;
  }): Promise<Memory> => {
    const res = await fetch("https://100.83.147.76:8003/api/add-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memoryData),
    });
  
    if (!res.ok) throw new Error(await res.text());
    
    return await res.json();
  };
  
  /**
   * Extract memories from a chat response object
   * Handles both direct memory arrays and memory blocks that need parsing
   */
  export const extractMemoriesFromResponse = (responseData: any): Memory[] => {
    // Check for direct memories array first
    if (responseData.memories && Array.isArray(responseData.memories)) {
      return responseData.memories;
    }
    
    // Check for memory block that needs parsing
    if (responseData.memory_block) {
      return parseMemoryBlock(responseData.memory_block);
    }
    
    // No memories found
    return [];
  };
