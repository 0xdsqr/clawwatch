export default {
  routeRules: {
    "/": { isr: 30 },
    "/agents/**": { isr: 30 },
    "/monitoring": { isr: 30 },
    "/metrics": { isr: 30 },
    "/alerting": { isr: 30 },
  },
};
