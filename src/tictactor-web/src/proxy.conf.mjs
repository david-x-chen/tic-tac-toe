export default {
  "/api/**": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  },
  "/game/**": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
