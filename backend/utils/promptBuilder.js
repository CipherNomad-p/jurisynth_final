const buildLegalPrompt = (documentText, settings = {}) => {
  const basePrompt = `
You are a senior legal analyst.

Analyze the following legal documents:

${documentText}
`;

  const depthInstructions = {
    "Standard": "Provide a concise 3-paragraph executive summary.",
    "Comprehensive": "Provide structured analysis including timeline, parties, and arguments.",
    "Deep Scan": "Perform deep legal analysis including contradictions, missing evidence, and insights."
  };

  const instruction =
    depthInstructions[settings?.analysisDepth] ||
    depthInstructions["Standard"];

  return `
${basePrompt}

TASK:
${instruction}

IMPORTANT:
- Output ONLY valid JSON
- Do NOT add markdown
- Do NOT add explanations

FORMAT:
{
  "summary": "string",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"]
}
`;
};

module.exports = buildLegalPrompt;