
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InvoiceList from '@/components/InvoiceList';
import InvoiceForm from '@/components/InvoiceForm';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';

const Invoices = () => {
  const { user, hasRole } = useAuth();

  // Allow access for promoters, comedians, and admins
  if (!user || (!hasRole('promoter') && !hasRole('comedian') && !hasRole('admin'))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h1 className="text-2xl font-bold mb-4">Invoice Access Required</h1>
            <p className="text-purple-200">Only promoters, comedians, and admins can access the invoicing system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<InvoiceList />} />
          <Route path="/new" element={<InvoiceForm />} />
        </Routes>
      </div>
    </div>
  );
};

export default Invoices;
