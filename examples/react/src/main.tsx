import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import '@story-map/react-story-map/styles.css';
import App from './App.js';
import './app.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
