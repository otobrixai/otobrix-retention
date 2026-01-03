/* global __ENV */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const dashboardLatency = new Trend("dashboard_latency_ms");

// SIMPLE options for smoke test
export let options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"], // Less than 1% failures
    checks: ["rate>0.95"] // 95% of checks should pass
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Use the SIMPLE test endpoint
const API_PATH = `/api/test/simple`;

export default function () {
  const url = `${BASE_URL}${API_PATH}`;
  
  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "simple_test" },
    timeout: "10s",
  };
  
  const res = http.get(url, params);
  
  // SIMPLE checks - just verify we get 200
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response is JSON": (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    }
  });
  
  sleep(1); // 1 second think time
}
