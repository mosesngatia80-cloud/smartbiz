import { useEffect, useState, useRef } from "react";
import socket from "../socket";

export default function Chat({ businessId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.emit("join_room", businessId);

    socket.on("chat_history", (history) => {
      setMessages(history);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
    };
  }, [businessId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send_message", {
      businessId,
      message: text,
      sender: "client"
    });

    setText("");
  };

  return (
    <div style={styles.container}>
      {/* CHAT BOX */}
      <div style={styles.chatBox}>
        {messages.map((m) => (
          <div
            key={m._id || Math.random()}
            style={{
              ...styles.message,
              alignSelf:
                m.sender === "client"
                  ? "flex-end"
                  : "flex-start",
              background:
                m.sender === "client"
                  ? "#DCF8C6"
                  : "#FFF"
            }}
          >
            <div style={styles.sender}>
              {m.sender}
            </div>
            <div>{m.message}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div style={styles.inputBox}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
          onKeyDown={(e) =>
            e.key === "Enter" && sendMessage()
          }
        />

        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#ECE5DD",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  message: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 10,
    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
  },
  sender: {
    fontSize: 10,
    opacity: 0.6,
    marginBottom: 3,
  },
  inputBox: {
    display: "flex",
    padding: 10,
    background: "#fff",
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "1px solid #ccc",
    outline: "none",
  },
  button: {
    padding: "10px 20px",
    borderRadius: 20,
    border: "none",
    background: "#128C7E",
    color: "white",
    cursor: "pointer",
  },
};
