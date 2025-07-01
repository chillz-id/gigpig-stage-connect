
import React from 'react';

interface CareerHighlightsProps {
  accomplishments: string[];
}

const CareerHighlights: React.FC<CareerHighlightsProps> = ({ accomplishments }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Career Highlights</h3>
      <div className="space-y-3">
        {accomplishments.map((accomplishment, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-300">{accomplishment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerHighlights;
