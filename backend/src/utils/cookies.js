export function setRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true, // Always use secure cookies (HTTPS only)
    sameSite: "strict", // Always use strict for maximum CSRF protection
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", {
    path: "/"
  });
}