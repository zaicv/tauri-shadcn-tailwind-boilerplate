import React from "react";
import { format } from "date-fns";

const MemoryListView = ({ memories, personaList }) => {
  const getPersonaName = (id) =>
    personaList.find((p) => p.id === id)?.name || "Unknown";

  return (
    <ul className="space-y-4">
      {memories.map((memory) => (
        <li
          key={memory.id}
          className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition"
        >
          <h3 className="text-xl font-semibold text-foreground">
            {memory.name}
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {memory.content}
          </p>
          <div className="mt-2 text-sm space-y-1">
            <p>
              <strong>Tags:</strong>{" "}
              {memory.tags?.length ? memory.tags.join(", ") : "None"}
            </p>
            <p>
              <strong>Importance:</strong> {memory.importance}
            </p>
            <p>
              <strong>Persona:</strong> {getPersonaName(memory.persona_id)}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {format(new Date(memory.created_at), "PPP p")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MemoryListView;