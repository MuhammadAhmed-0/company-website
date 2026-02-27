import express from "express";
import path from "path";

const app = express();
const publicDir = path.resolve(import.meta.dirname, "..", "public");

app.use(express.static(publicDir, { extensions: ["html"] }));

app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, "index.html"));
});

const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, "0.0.0.0", () => {
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${time} [express] serving static files on port ${port}`);
});
