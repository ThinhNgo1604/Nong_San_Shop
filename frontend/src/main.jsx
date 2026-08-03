// Safe patch for environments where window.fetch has a getter without a setter
try {
    let _fetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
        get() {
            return _fetch;
        },
        set(v) {
            _fetch = v;
        },
        configurable: true,
        enumerable: true
    });
} catch (e) {
    // Ignore error if window or fetch property is not configurable
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);