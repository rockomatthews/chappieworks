type Message = {
  speaker: "Skeptic" | "Chappie";
  text: string;
};

const COLORS = {
  Skeptic: {
    name: "#c97a3a",
    bubble: "bg-[#1e1710] border border-[#c97a3a]/30",
    dot: "bg-[#c97a3a]",
  },
  Chappie: {
    name: "#c9a437",
    bubble: "bg-[#161a10] border border-[#c9a437]/30",
    dot: "bg-[#c9a437]",
  },
};

export function ChatThread({
  title,
  messages,
}: {
  title: string;
  messages: Message[];
}) {
  return (
    <div className="card rounded-xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      <div className="flex flex-col gap-4">
        {messages.map((msg, i) => {
          const isChappie = msg.speaker === "Chappie";
          const c = COLORS[msg.speaker];
          return (
            <div
              key={i}
              className={`flex gap-3 ${isChappie ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar dot */}
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`w-7 h-7 rounded-full ${c.dot} flex items-center justify-center`}
                >
                  <span className="text-[10px] font-bold text-black">
                    {msg.speaker[0]}
                  </span>
                </div>
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${c.bubble} ${
                  isChappie ? "rounded-tr-sm" : "rounded-tl-sm"
                }`}
              >
                <p
                  className="text-xs font-semibold mb-1.5 uppercase tracking-widest"
                  style={{ color: c.name }}
                >
                  {msg.speaker}
                </p>
                <p className="text-sm text-[var(--color-paper)]/90 leading-relaxed">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
