
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEventProfitability } from '@/hooks/useEventProfitability';
import { Search, Download, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const EventProfitability = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { events, isLoading, exportData } = useEventProfitability();

  const filteredEvents = events?.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExport = () => {
    exportData(filteredEvents, 'event-profitability');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Event Profitability Analysis</h2>
        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-300 mb-2">{event.venue} • {new Date(event.event_date).toLocaleDateString('en-AU')}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <div>
                              <p className="text-xs text-gray-400">Revenue</p>
                              <p className="font-medium text-white">${event.total_revenue?.toLocaleString('en-AU') || '0'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-red-400" />
                            <div>
                              <p className="text-xs text-gray-400">Costs</p>
                              <p className="font-medium text-white">${event.total_costs?.toLocaleString('en-AU') || '0'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-xs text-gray-400">Profit</p>
                              <p className={`font-medium ${event.profit_margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${event.profit_margin?.toLocaleString('en-AU') || '0'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <div>
                              <p className="text-xs text-gray-400">Tickets</p>
                              <p className="font-medium text-white">{event.tickets_sold || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Badge 
                          variant={event.profit_margin >= 0 ? 'default' : 'destructive'}
                          className={event.profit_margin >= 0 ? 'bg-green-600' : 'bg-red-600'}
                        >
                          {event.profit_margin >= 0 ? '+' : ''}{((event.profit_margin / Math.max(event.total_revenue, 1)) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No events found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventProfitability;
