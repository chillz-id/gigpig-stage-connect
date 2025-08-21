
import React, { useState } from 'react';
import ComedianSearch from '@/components/ComedianSearch';
import ComedianList from '@/components/ComedianList';
import { useComedians } from '@/hooks/data/useComedians';
import { SEOHead, generateMetaTags, generateBreadcrumbSchema, generateOrganizationSchema } from '@/utils/seo';

const Comedians = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { comedians, loading, contacting, handleContact } = useComedians();

  // Generate SEO meta tags
  const metaTags = generateMetaTags({
    title: 'Comedians - Stand Up Sydney',
    description: 'Discover talented comedians from all over Australia. Browse profiles, view upcoming shows, and connect with Sydney\'s comedy community.',
    url: '/comedians',
    type: 'website'
  });
  
  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Comedians' }
  ]);
  const organizationSchema = generateOrganizationSchema();
  
  return (
    <>
      <SEOHead
        {...metaTags}
        structuredData={[organizationSchema, breadcrumbSchema]}
      />
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
    </>
  );
};

export default Comedians;
