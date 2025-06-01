export default function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center text-center max-w-4xl mx-auto px-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
          CineTrack
        </h1>
        <h2 className="text-xl lg:text-2xl text-muted-foreground">
          Your Ultimate Movie & TV Show Tracker
        </h2>
      </div>
      
      <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
        Discover, track, and review your favorite movies and TV shows. 
        Build watchlists, share reviews, and connect with fellow film enthusiasts.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Track what you watch
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Discover new content
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Share your reviews
        </div>
      </div>
      
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
