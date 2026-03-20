const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");

const PYTHON_SCRIPT = path.join(__dirname, "../translation_worker.py");

// Adjust Python command if needed
const PYTHON_BIN = process.platform === "win32" ? "py" : "python3";

router.post("/translate", async (req, res) => {
  const { texts, srcLang = "mar_Deva", tgtLang } = req.body;

  if (!tgtLang) {
    return res.status(400).json({ error: "tgtLang is required" });
  }

  if (srcLang === tgtLang) {
    return res.json({ translated: texts });
  }

  const payload = JSON.stringify({ texts, srcLang, tgtLang });

  try {
    const result = await runPython(payload);
    res.json(result);
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

function runPython(inputJson) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [PYTHON_SCRIPT]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || "Python error"));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Invalid JSON from Python"));
      }
    });

    proc.stdin.write(inputJson);
    proc.stdin.end();
  });
}

module.exports = router;