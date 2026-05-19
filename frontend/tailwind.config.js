export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F3A",
        clinical: "#1D9BF0",
        mint: "#2DBE9F",
        ink: "#172033",
        cloud: "#F5F8FC"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(11, 31, 58, 0.10)",
        card: "0 18px 45px rgba(15, 23, 42, 0.08)",
        nav: "0 22px 60px rgba(11, 31, 58, 0.20)"
      }
    }
  },
  plugins: []
};
