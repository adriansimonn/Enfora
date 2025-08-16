exports.verifyEvidence = (req, res) => {
  // Later send image to AI model
  res.json({ valid: true, reason: "Mock: Screenshot includes keywords" });
};
