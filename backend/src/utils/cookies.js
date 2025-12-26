export function setRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", {
    path: "/auth/refresh"
  });
}