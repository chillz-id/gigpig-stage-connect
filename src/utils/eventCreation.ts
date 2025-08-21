
import { supabase } from '@/integrations/supabase/client';
import { CustomDate } from '@/types/eventTypes';

export const generateRecurringEvents = (
  baseEventData: any,
  userId: string,
  recurrencePattern: string,
  recurrenceEndDate?: string,
  customDates?: CustomDate[]
) => {
  const seriesId = crypto.randomUUID();
  const eventsToCreate = [];

  if (recurrencePattern === 'custom' && customDates && customDates.length > 0) {
    customDates.forEach((customDate, dateIndex) => {
      customDate.times.forEach((timeSlot, timeIndex) => {
        const eventDateTime = new Date(customDate.date);
        const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
        eventDateTime.setHours(hours, minutes, 0, 0);
        
        eventsToCreate.push({
          ...baseEventData,
          promoter_id: userId,
          event_date: eventDateTime.toISOString(),
          start_time: timeSlot.startTime,
          end_time: timeSlot.endTime || null,
          is_recurring: true,
          recurrence_pattern: recurrencePattern,
          parent_event_id: dateIndex === 0 && timeIndex === 0 ? null : eventsToCreate[0]?.id || null,
          series_id: seriesId
        });
      });
    });
  } else if (recurrencePattern && recurrenceEndDate) {
    const startDate = new Date(baseEventData.event_date);
    const endDate = new Date(recurrenceEndDate);
    let currentDate = new Date(startDate);
    let isFirst = true;

    while (currentDate <= endDate) {
      eventsToCreate.push({
        ...baseEventData,
        promoter_id: userId,
        event_date: currentDate.toISOString(),
        is_recurring: true,
        recurrence_pattern: recurrencePattern,
        parent_event_id: isFirst ? null : eventsToCreate[0]?.id || null,
        series_id: seriesId,
        recurrence_end_date: recurrenceEndDate
      });

      if (recurrencePattern === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (recurrencePattern === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      isFirst = false;
    }
  }

  return eventsToCreate;
};

export const createEventSpots = async (events: any[], spotDetails: any[]) => {
  if (!spotDetails || spotDetails.length === 0) return;

  const spotsToCreate: any[] = [];
  events.forEach((event) => {
    spotDetails.forEach((spot, spotIndex) => {
      spotsToCreate.push({
        event_id: event.id,
        spot_name: spot.spot_name,
        is_paid: spot.is_paid,
        payment_amount: spot.payment_amount || 0,
        currency: spot.currency,
        duration_minutes: spot.duration_minutes || 5,
        spot_order: spotIndex + 1
      });
    });
  });

  const { error } = await supabase
    .from('event_spots')
    .insert(spotsToCreate);

  if (error) throw error;
};
