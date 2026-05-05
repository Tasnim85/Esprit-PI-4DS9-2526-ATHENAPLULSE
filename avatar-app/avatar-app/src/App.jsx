import Avatar from "./components/Avatar";
import Chat from "./components/Chat";

function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Avatar />
      </div>
      <div style={{ padding: "12px 16px 20px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <Chat />
      </div>
    </div>
  );
}

export default App;
