import { useState, useEffect } from "react";

export default function FloatingWidget() {
  // 获取URL参数决定模式
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode") || "icon";

  if (mode === "icon") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        <IconWidget />
      </div>
    );
  } else if (mode === "menu") {
    return <MenuWidget />;
  } else if (mode === "background") {
    return <BackgroundWidget />;
  } else {
    return <PanelWidget />;
  }
}

// 图标组件
function IconWidget() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handleClick = () => {
    // 只有在没有拖动时才触发切换
    if (!hasMoved) {
      // @ts-ignore - electron API
      window.electronAPI?.togglePanel();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.screenX, y: e.screenY });
  };

  const handleMouseEnter = () => {
    // @ts-ignore - electron API
    window.electronAPI?.onIconHoverEnter();
  };

  const handleMouseLeave = () => {
    // @ts-ignore - electron API
    window.electronAPI?.onIconHoverLeave();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.screenX - dragStart.x;
        const deltaY = e.screenY - dragStart.y;
        
        // 如果移动距离超过阈值，标记为拖动
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          setHasMoved(true);
        }
        
        // @ts-ignore - electron API
        window.electronAPI?.moveIcon(deltaX, deltaY);
        setDragStart({ x: e.screenX, y: e.screenY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // 拖动结束后检查吸附
        // @ts-ignore - electron API
        window.electronAPI?.snapIcon();
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging ? "grabbing" : "pointer",
        backgroundColor: "transparent",
        transition: "transform 0.2s",
        userSelect: "none",
        WebkitUserSelect: "none",
      } as React.CSSProperties}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        style={{
          fontSize: "40px",
          lineHeight: "40px",
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: "none",
          transform: "scale(1)",
          transition: "transform 0.2s",
        } as React.CSSProperties}
        draggable={false}
      >
        🤖
      </div>
    </div>
  );
}

// 浮层组件
function PanelWidget() {
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([...messages, inputValue]);
      setInputValue("");
      
      if (!isExpanded) {
        setIsExpanded(true);
        // @ts-ignore - electron API
        window.electronAPI?.resizePanel(440, 800);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.screenX, y: e.screenY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.screenX - dragStart.x;
        const deltaY = e.screenY - dragStart.y;
        // @ts-ignore - electron API
        window.electronAPI?.movePanel(deltaX, deltaY);
        setDragStart({ x: e.screenX, y: e.screenY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
      }}
    >
      {/* 顶部拖动栏 */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: "40px",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        <button
          onClick={() => {
            // @ts-ignore - electron API
            window.electronAPI?.togglePanel();
          }}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "#ff5f57",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#fff",
            padding: 0,
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: "13px", color: "#666" }}>
          AI 助手
        </div>
        <div style={{ width: "24px" }} />
      </div>

      {/* 聊天内容区域 - 仅在扩展后显示 */}
      {isExpanded && (
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            backgroundColor: "#fafafa",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "12px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {msg}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#ffffff",
          borderTop: isExpanded ? "1px solid #e0e0e0" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            style={{
              flex: 1,
              height: "36px",
              padding: "0 12px",
              border: "1px solid #e0e0e0",
              borderRadius: "18px",
              fontSize: "14px",
              outline: "none",
            }}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: inputValue.trim() ? "#2196f3" : "#e0e0e0",
              color: "#fff",
              cursor: inputValue.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// Hover 菜单组件
function MenuWidget() {
  const handleMouseEnter = () => {
    // @ts-ignore - electron API
    window.electronAPI?.onMenuHoverEnter();
  };

  const handleMouseLeave = () => {
    // @ts-ignore - electron API
    window.electronAPI?.onMenuHoverLeave();
  };

  const menuItems = [
    { icon: "📞", label: "语音通话", action: () => console.log("语音通话") },
    { icon: "📤", label: "共享应用或屏幕", action: () => console.log("共享应用") },
    { icon: "●", label: "记录会议", action: () => console.log("记录会议") },
    { icon: "✂️", label: "截图提问", action: () => console.log("截图提问") },
    { icon: "🎤", label: "实时双语字幕", action: () => console.log("实时双语字幕") },
  ];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#d5dde5",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        padding: "8px",
        gap: "4px",
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
            color: "#1f2937",
            transition: "background-color 0.2s",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>
            {item.icon}
          </span>
          <span style={{ flex: 1, textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// 背景组件
function BackgroundWidget() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "16px",
        backgroundColor: "#d5dde5",
        borderRadius: "21px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          color: "#6b7280",
          fontWeight: 500,
          userSelect: "none",
          lineHeight: "42px",
        }}
      >
        问问千易
      </span>
    </div>
  );
}
