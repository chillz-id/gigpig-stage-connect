
import React, { useState } from 'react';
import ComedianSearch from '@/components/ComedianSearch';
import ComedianList from '@/components/ComedianList';
import { useComedians } from '@/hooks/useComedians';

const Comedians = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { comedians, loading, contacting, handleContact } = useComedians();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-red-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comedians</h1>
          <p className="text-gray-300">
            Discover talented Comedians from all over Australia
          </p>
        </div>

        <ComedianSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ComedianList
          comedians={comedians}
          loading={loading}
          searchTerm={searchTerm}
          contacting={contacting}
          onContact={handleContact}
        />
      </div>
    </div>
  );
};

export default Comedians;
