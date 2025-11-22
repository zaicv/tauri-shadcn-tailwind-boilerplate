import React from "react";
import { format } from "date-fns";

const MemoryBoardView = ({ memories, personaList }) => {
  const personaMap = personaList.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const groupedByPersona = memories.reduce((acc, memory) => {
    const key = memory.persona_id || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(memory);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Object.entries(groupedByPersona).map(([personaId, groupedMemories]) => {
        const persona = personaMap[personaId];
        return (
          <div key={personaId} className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              {persona?.src ? (
                <img
                  src={persona.src}
                  alt={persona.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full" />
              )}
              <h2 className="font-bold text-lg text-foreground">
                {persona?.name || "Unknown Persona"}
              </h2>
            </div>

            <div className="space-y-4">
              {groupedMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-[#f4f4f4] border border-border rounded-lg p-3 shadow-sm hover:shadow-md"
                >
                  <h3 className="text-md font-semibold text-foreground">
                    {memory.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {memory.content?.slice(0, 100)}...
                  </p>
                  <div className="mt-1 text-xs space-y-0.5">
                    <p>
                      <strong>Tags:</strong> {memory.tags?.join(", ") || "None"}
                    </p>
                    <p>
                      <strong>Importance:</strong> {memory.importance}
                    </p>
                    <p>
                      <strong>Created:</strong> {format(new Date(memory.created_at), "MMM d, yyyy")} 
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemoryBoardView;