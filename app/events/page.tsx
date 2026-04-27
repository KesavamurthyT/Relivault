
import EventHistory from "@/components/dashboards/event-history";

export default function EventsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Contract Event History</h1>
      <EventHistory />
    </div>
  );
}
