import React, { useState, useEffect } from "react";

interface TokenUsage {
  model_name: string;
  total_tokens: number;
}

interface TokenUsageProps {
  userId: string;
  theme: "light" | "dark" | "system";
}

const TokenUsageComponent: React.FC<TokenUsageProps> = ({ userId, theme }) => {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTokenUsage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://100.83.147.76:8003/token-usage/${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch token usage");
      }
      const usage = await response.json();
      console.log("Token usage response:", usage);
      setTokenUsage(Array.isArray(usage) ? usage : []);
    } catch (error) {
      console.error("Failed to load token usage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTokenUsage();
    }
  }, [userId]);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading usage...</div>;
  }

  return (
    <div
      className={`p-4 rounded-lg ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-100"
      }`}
    >
      <h3 className="text-lg font-semibold mb-3">Token Usage</h3>
      {tokenUsage.length === 0 ? (
        <p className="text-sm text-gray-500">No usage data available</p>
      ) : (
        <div className="space-y-2">
          {tokenUsage.map((usage, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium">{usage.model_name}</span>
              <span className="text-sm text-gray-600">
                {usage.tokens_used.toLocaleString()} tokens
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={loadTokenUsage}
        className="mt-3 text-sm text-blue-500 hover:text-blue-700"
      >
        Refresh
      </button>
    </div>
  );
};

export default TokenUsageComponent;
