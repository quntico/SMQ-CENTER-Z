import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
const AdminLayout = React.lazy(() => import('@/layouts/AdminLayout'));
const ClientLayout = React.lazy(() => import('@/layouts/ClientLayout'));

function App() {
  return (
    <HelmetProvider>
      <Router>
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-black text-white">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<AdminLayout />} />
            <Route path="/cotizacion/:slug" element={<ClientLayout />} />
          </Routes>
        </React.Suspense>
      </Router>
    </HelmetProvider>
  );
}

export default App;