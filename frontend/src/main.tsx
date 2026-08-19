import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// Initialize the global network ID for Midnight SDK before rendering
setNetworkId('preview');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
