import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

import Suppliers from '@/pages/Suppliers';
import RawMaterials from '@/pages/RawMaterials';
import Customers from '@/pages/Customers';
import Products from '@/pages/Products';
import ProductCreate from '@/pages/ProductCreate';
import ProductEdit from '@/pages/ProductEdit';
import Orders from '@/pages/Orders';
import ImportPage from '@/pages/ImportPage';
import Management from '@/pages/Management';
import Costs from '@/pages/Costs';
import Purchases from '@/pages/Purchases';
import FixedCosts from '@/pages/FixedCosts';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductCreate />} />
          <Route path="/products/:id/edit" element={<ProductEdit />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/raw-materials" element={<RawMaterials />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/management" element={<Management />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/fixed-costs" element={<FixedCosts />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
