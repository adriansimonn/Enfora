export function setRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true, // Always use secure cookies (HTTPS only)
    sameSite: "none", // Required for cross-origin cookies (frontend and backend on different domains)
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", {
    path: "/"
  });
}