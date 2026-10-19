export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="h-4 w-32 bg-secondary rounded-lg mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mobile-card p-4">
            <div className="h-10 w-10 bg-secondary rounded-xl mb-2" />
            <div className="h-6 w-20 bg-secondary rounded-lg mb-1" />
            <div className="h-3 w-16 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="mobile-card p-4">
            <div className="h-5 w-32 bg-secondary rounded-lg mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-12 bg-secondary rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
