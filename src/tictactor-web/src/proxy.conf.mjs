export default {
  "/api/**": {
    "target": "https://localhost:9080",
    "secure": false,
    "changeOrigin": true
  },
  "/game/**": {
    "target": "https://localhost:9080",
    "secure": false,
    "changeOrigin": true
  }
}
