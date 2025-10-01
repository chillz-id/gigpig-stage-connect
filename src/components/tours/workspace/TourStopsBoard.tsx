import { type ReactNode } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { ArrowDown, Edit, Eye, MapPin, Trash2, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TourStop, TourStopStatus } from '@/types/tour';

import { TourStopSummary } from './TourStopSummary';

interface TourStopsBoardProps {
  stops: TourStop[];
  dragEnabled: boolean;
  isEditable: boolean;
  isLoading: boolean;
  onDragEnd: (result: DropResult) => void;
  onSelectStop: (stop: TourStop) => void;
  onDeleteStop: (id: string) => void;
  onAddStop: () => void;
  getStatusColor: (status: TourStopStatus) => string;
  getStatusIcon: (status: TourStopStatus) => ReactNode;
}

export function TourStopsBoard({
  stops,
  dragEnabled,
  isEditable,
  isLoading,
  onDragEnd,
  onSelectStop,
  onDeleteStop,
  onAddStop,
  getStatusColor,
  getStatusIcon,
}: TourStopsBoardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Tour Stops
          {dragEnabled && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
              Drag to reorder
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={result => onDragEnd(result)}>
          <Droppable droppableId="tour-stops" isDropDisabled={!dragEnabled}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                {stops.map((stop, index) => (
                  <Draggable
                    key={stop.id}
                    draggableId={stop.id}
                    index={index}
                    isDragDisabled={!dragEnabled}
                  >
                    {(itemProvided, snapshot) => (
                      <div
                        ref={itemProvided.innerRef}
                        {...itemProvided.draggableProps}
                        className={cn(
                          'bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 transition-shadow',
                          snapshot.isDragging && 'shadow-lg border-purple-500/60',
                        )}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {dragEnabled && (
                                  <div
                                    {...itemProvided.dragHandleProps}
                                    className="cursor-grab text-slate-400"
                                  >
                                    ::
                                  </div>
                                )}
                                <Badge className={cn('border', getStatusColor(stop.status))}>
                                  <StatusIcon icon={getStatusIcon(stop.status)} />
                                  <span className="ml-2 capitalize">{stop.status}</span>
                                </Badge>
                              </div>
                              <TourStopSummary stop={stop} />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-600 text-slate-300"
                                onClick={() => onSelectStop(stop)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              {isEditable && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-600 text-slate-300"
                                    onClick={() => onSelectStop(stop)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/40 text-red-200 hover:bg-red-500/10"
                                    onClick={() => onDeleteStop(stop.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {index < stops.length - 1 && (
                            <ConnectionToNext stop={stop} nextStop={stops[index + 1]} />
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {stops.length === 0 && !isLoading && (
                  <EmptyState isEditable={isEditable} onAddStop={onAddStop} />
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading tour stops...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ConnectionToNextProps {
  stop: TourStop;
  nextStop: TourStop;
}

function ConnectionToNext({ stop, nextStop }: ConnectionToNextProps) {
  return (
    <div className="ml-6 mt-4 flex items-center gap-2 text-gray-400 text-sm">
      <ArrowDown className="w-4 h-4" />
      <span>
        Travel to {nextStop.venue_city}
        {stop.distance_to_next_km && ` (${stop.distance_to_next_km}km)`}
        {stop.travel_time_to_next && ` - ${Math.round(stop.travel_time_to_next / 60)}h journey`}
      </span>
    </div>
  );
}

function EmptyState({ isEditable, onAddStop }: { isEditable: boolean; onAddStop: () => void }) {
  return (
    <div className="text-center py-16">
      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-6" />
      <h3 className="text-xl font-semibold text-white mb-2">No tour stops yet</h3>
      <p className="text-gray-400 mb-6">Start planning your tour by adding the first stop!</p>
      {isEditable && (
        <Button
          onClick={onAddStop}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add First Stop
        </Button>
      )}
    </div>
  );
}

function StatusIcon({ icon }: { icon: React.ReactNode }) {
  if (!icon) return null;
  return <span className="flex items-center text-inherit">{icon}</span>;
}
