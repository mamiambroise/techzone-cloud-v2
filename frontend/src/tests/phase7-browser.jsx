// Real-browser harness: same published component, stylesheet and API, no fixtures.
import React from 'react';
import { createRoot } from 'react-dom/client';
import PublishedApplication from '../components/pack-runtime/PublishedApplication.jsx';
import '../index.css';
const params = new URLSearchParams(window.location.search);
createRoot(document.getElementById('root')).render(<PublishedApplication packCode={params.get('pack')} packVersion="1.0.0" tenantId={params.get('tenant')} />);
