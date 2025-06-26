
import React, { useState } from 'react';
import ComedianSearch from '@/components/ComedianSearch';
import ComedianList from '@/components/ComedianList';
import { useComedians } from '@/hooks/useComedians';

const Comedians = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { comedians, loading, contacting, handleContact } = useComedians();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Stand Up Sydney Comedians</h1>
          <p className="text-muted-foreground">
            Discover talented comedians in Sydney's vibrant comedy scene
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
