import React, { useState, useEffect, useRef } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBe-ArPLhZXm3kYHTCBB5Y6uSVkCoIgPsI",
  authDomain: "fadel-ai.firebaseapp.com",
  projectId: "fadel-ai",
  storageBucket: "fadel-ai.firebasestorage.app",
  messagingSenderId: "685305302652",
  appId: "1:685305302652:web:d0112a62c0d0bec4e2c3f9",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const storage = getStorage(app);

const CopyButton = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={styles.copyBtn}>
      {copied ? "✅ Tersalin" : "📋 Salin"}
    </button>
  );
};

export default function FadelAI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("fadel_history") || "[]");
    setHistory(saved);
    setMessages([
      {
        role: "assistant",
        content: `### Perkenalkan Fadel AI, asisten FADEL AI.
Dapatkan bantuan untuk menulis, membuat rencana, bertukar pikiran, dan banyak lagi. Manfaatkan kecanggihan AI generatif buatan pelajar **MA PLUS RMB**.

*Sistem ini aktif sejak: 25-04-2026*`,
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    setIsLoading(true);
    let fileUrl = "";
    const currentInput = input;

    try {
      if (file) {
        if (file.type.startsWith("image/")) {
          const formData = new FormData();
          formData.append("image", file);
          const res = await fetch(
            "https://api.imgbb.com/1/upload?key=67f6929949988e4040a911762e519363",
            { method: "POST", body: formData }
          );
          const data = await res.json();
          fileUrl = data.data.url;
        } else {
          const fileRef = ref(
            storage,
            `fadel-files/${Date.now()}-${file.name}`
          );
          const snap = await uploadBytes(fileRef, file);
          fileUrl = await getDownloadURL(snap.ref);
        }
      }

      if (messages.length <= 1) {
        const newHistory = [
          { id: Date.now(), title: currentInput.substring(0, 25) + "..." },
          ...history,
        ].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem("fadel_history", JSON.stringify(newHistory));
      }

      const userMsg = {
        role: "user",
        content: currentInput,
        attachment: fileUrl,
        fileName: file?.name,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setFile(null);

      const response = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(
          currentInput
        )}?system=Kamu adalah Fadel AI buatan Fadel Muhammad pelajar MA PLUS RMB. Selalu berikan jawaban dengan format Markdown yang sangat rapi, gunakan paragraf, dan list yang jelas. Jangan gunakan simbol aneh.`
      );
      const aiText = await response.text();
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mobileHeader}>
        <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>
          ☰
        </button>
        <span style={{ color: "gold", fontWeight: "bold" }}>FADEL AI</span>
        <button onClick={() => window.location.reload()} style={styles.menuBtn}>
          ↻
        </button>
      </div>

      <div style={{ ...styles.sidebar, left: isSidebarOpen ? "0" : "-100%" }}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>F</div>
          <span style={styles.logoText}>FADEL AI</span>
          <button
            onClick={() => setSidebarOpen(false)}
            style={styles.closeMobile}
          >
            ✕
          </button>
        </div>

        <button
          onClick={() => {
            setMessages([{ role: "assistant", content: "Chat baru siap!" }]);
            setSidebarOpen(false);
          }}
          style={styles.newChatBtn}
        >
          + Chat Baru
        </button>

        <div style={styles.historyList}>
          <div style={styles.label}>RIWAYAT TERAKHIR</div>
          {history.map((h) => (
            <div key={h.id} style={styles.historyItem}>
              💬 {h.title}
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={{ color: "gold", fontSize: "12px" }}>MA PLUS RMB</div>
          <div style={{ color: "#444", fontSize: "10px" }}>
            Build: 25-04-2026
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.chatBox}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.msgRow,
                background:
                  msg.role === "user"
                    ? "transparent"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <div style={styles.msgContent}>
                <div
                  style={{
                    ...styles.avatar,
                    background: msg.role === "user" ? "#333" : "gold",
                  }}
                >
                  {msg.role === "user" ? "U" : "F"}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={styles.sender}>
                    {msg.role === "user" ? "Fadel Muhammad" : "Fadel AI"}
                  </div>

                  {msg.attachment && (
                    <div style={styles.fileBox}>
                      {msg.attachment.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img
                          src={msg.attachment}
                          style={styles.imgPreview}
                          alt="upload"
                        />
                      ) : (
                        <a
                          href={msg.attachment}
                          target="_blank"
                          style={{ color: "gold", textDecoration: "none" }}
                        >
                          📁 {msg.fileName}
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className="markdown-container"
                    style={styles.markdownBody}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      children={msg.content}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div style={styles.codeWrap}>
                              <div style={styles.codeHead}>
                                <span>{match[1]}</span>
                                <CopyButton content={String(children)} />
                              </div>
                              <SyntaxHighlighter
                                children={String(children).replace(/\n$/, "")}
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              />
                            </div>
                          ) : (
                            <code
                              className={className}
                              style={styles.inlineCode}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div
              style={{ ...styles.msgContent, padding: "20px", color: "#555" }}
            >
              Fadel AI sedang mengetik...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={styles.footer}>
          <form onSubmit={handleSendMessage} style={styles.inputWrap}>
            <label style={styles.icon}>
              📎
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={file ? `File: ${file.name}` : "Tulis pesan..."}
            />
            <button type="submit" style={styles.sendBtn} disabled={isLoading}>
              ↑
            </button>
          </form>
          <div style={styles.copyText}>
            Fadel AI © 2026 | Developer: Fadel Muhammad
          </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={styles.overlay} />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#050505",
    color: "#e0e0e0",
    fontFamily: "Segoe UI, Roboto, sans-serif",
    position: "relative",
  },
  mobileHeader: {
    display: "none",
    width: "100%",
    height: "50px",
    background: "#000",
    borderBottom: "1px solid #222",
    position: "absolute",
    top: 0,
    zIndex: 5,
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 15px",
  },
  sidebar: {
    width: "260px",
    background: "#000",
    borderRight: "1px solid #222",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 20,
    transition: "0.3s",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "30px",
  },
  logoIcon: {
    width: "30px",
    height: "30px",
    background: "gold",
    borderRadius: "5px",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  logoText: { fontWeight: "bold", fontSize: "18px" },
  newChatBtn: {
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  historyList: { flex: 1, overflowY: "auto" },
  historyItem: {
    fontSize: "13px",
    color: "#888",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  label: { fontSize: "10px", color: "#444", marginBottom: "10px" },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  chatBox: { flex: 1, overflowY: "auto", paddingBottom: "100px" },
  msgRow: {
    padding: "25px 0",
    borderBottom: "1px solid rgba(255,255,255,0.02)",
  },
  msgContent: {
    maxWidth: "800px",
    margin: "0 auto",
    display: "flex",
    gap: "15px",
    padding: "0 20px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "5px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000",
    fontWeight: "bold",
    fontSize: "14px",
  },
  sender: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  markdownBody: { lineHeight: "1.6", fontSize: "15px" },
  codeWrap: {
    margin: "15px 0",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #333",
  },
  codeHead: {
    background: "#222",
    padding: "5px 15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
    color: "#888",
  },
  copyBtn: {
    background: "#333",
    border: "none",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  footer: {
    padding: "20px",
    background: "linear-gradient(transparent, #050505 50%)",
  },
  inputWrap: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "#111",
    padding: "10px 15px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    border: "1px solid #333",
  },
  input: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#fff",
    outline: "none",
    padding: "0 10px",
    fontSize: "16px",
  },
  sendBtn: {
    background: "#fff",
    border: "none",
    borderRadius: "5px",
    width: "32px",
    height: "32px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  inlineCode: {
    background: "#222",
    color: "gold",
    padding: "2px 4px",
    borderRadius: "4px",
  },
  overlay: {
    display: "none",
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    zIndex: 15,
  },
  imgPreview: {
    maxWidth: "100%",
    borderRadius: "10px",
    marginTop: "10px",
    border: "1px solid #222",
  },
  fileBox: { marginBottom: "10px" },
  copyText: {
    textAlign: "center",
    fontSize: "10px",
    color: "#222",
    marginTop: "10px",
  },
};

// CSS UNTUK RAPIHKAN TEKS (ChatGPT Style)
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .markdown-container p { margin-bottom: 16px; margin-top: 0; }
    .markdown-container ul, .markdown-container ol { margin-bottom: 16px; padding-left: 20px; }
    .markdown-container li { margin-bottom: 8px; }
    .markdown-container h1, .markdown-container h2, .markdown-container h3 { margin: 24px 0 16px 0; color: #fff; }
    @media (max-width: 768px) {
      div[style*="width: 260px"] { position: absolute !important; height: 100%; z-index: 100; }
      div[style*="display: none"] { display: flex !important; }
      .chatBox { padding-top: 60px; }
    }
  `;
  document.head.appendChild(style);
}
