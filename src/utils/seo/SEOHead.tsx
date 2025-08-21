import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateMetaTags, MetaTagsProps } from './metaTags';

interface SEOHeadProps extends MetaTagsProps {
  structuredData?: object | object[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({ structuredData, ...metaProps }) => {
  const { title, meta, link } = generateMetaTags(metaProps);
  
  return (
    <Helmet>
      <title>{title}</title>
      {meta.map((item, index) => (
        <meta key={index} {...item} />
      ))}
      {link.map((item, index) => (
        <link key={index} {...item} />
      ))}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData],
            null,
            2
          )}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;