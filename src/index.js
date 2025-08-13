import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import App from './App';
import BoardProvider from './components/board/context/BoardContext';
import { BrowserRouter } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BoardProvider>
    {/* BrowserRouter가 App 컴포넌트를 감싸고 있어야 합니다. */}
    <BrowserRouter>
      <DndProvider backend={ HTML5Backend }>
      <React.StrictMode>
        <App />
      </React.StrictMode>
      </DndProvider>
    </BrowserRouter>
  </BoardProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
