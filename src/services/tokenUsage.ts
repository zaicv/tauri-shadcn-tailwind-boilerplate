export interface TokenUsage {
  model_name: string;
  total_tokens: number;
}

export const fetchTokenUsage = async (
  userId: string
): Promise<TokenUsage[]> => {
  try {
    const response = await fetch(
      `https://100.83.147.76:8003/token-usage/${userId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch token usage");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching token usage:", error);
    return [];
  }
};
