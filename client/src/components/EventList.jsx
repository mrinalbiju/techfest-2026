import EventCard from "./EventCard.jsx";

// Renders one EventCard per event using map (each with a unique key)
export default function EventList({ events, ...handlers }) {
  if (events.length === 0) return <p className="empty">No events match your search.</p>;
  return (
    <div className="cards">
      {events.map((ev) => (
        <EventCard key={ev._id} event={ev} {...handlers} />
      ))}
    </div>
  );
}
