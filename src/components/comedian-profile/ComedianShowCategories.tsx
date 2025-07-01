
import React, { useState } from 'react';

interface ComedianShowCategoriesProps {
  comedianId: string;
}

const ComedianShowCategories: React.FC<ComedianShowCategoriesProps> = ({ comedianId }) => {
  const [activeCategory, setActiveCategory] = useState('Solo Shows');
  
  // Mock data - in real app this would come from API based on comedian's confirmed shows
  const availableCategories = [
    'Showcases',
    'Solo Shows', // Always show this one
    'Live Podcast'
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-lg">
        {availableCategories.map((category, index) => (
          <React.Fragment key={category}>
            <button
              onClick={() => setActiveCategory(category)}
              className={`story-link transition-colors duration-200 ${
                activeCategory === category 
                  ? 'text-white font-semibold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {category}
            </button>
            {index < availableCategories.length - 1 && (
              <span className="text-gray-500">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ComedianShowCategories;
