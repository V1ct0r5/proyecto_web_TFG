import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-calendar/dist/Calendar.css';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Suspense fallback="loading...">
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </Suspense>
);
reportWebVitals();
