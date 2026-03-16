// Run this once to initialize your database
db.movies.insertMany([
  {
    title: "Fast & Furious 10",
    description: "The final chapter of the Fast & Furious saga.",
    poster: "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg",
    year: 2024,
    rating: 7.8,
    genre: ["Action", "Crime", "Thriller"],
    duration: "2h 21min",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    downloadUrl: "https://drive.google.com/file/d/1IyyDGATtjaE6z5yncmBNf0_V2UoicVZO/view",
    trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    trending: true,
    views: 1500
  },
  {
    title: "Oppenheimer",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    year: 2023,
    rating: 8.5,
    genre: ["Biography", "Drama", "History"],
    duration: "3h",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    downloadUrl: "https://drive.google.com/file/d/1IyyDGATtjaE6z5yncmBNf0_V2UoicVZO/view",
    trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    trending: true,
    views: 2300
  }
]);

db.live_tv.insertMany([
  {
    name: "SILA TV",
    logo: "https://via.placeholder.com/100/0066FF/FFFFFF?text=SILA",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    category: "Entertainment",
    status: "online"
  },
  {
    name: "Movie Channel",
    logo: "https://via.placeholder.com/100/FF0000/FFFFFF?text=MOVIES",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    category: "Movies",
    status: "online"
  }
]);

db.settings.insertOne({
  adsEnabled: true,
  subscriptionPrice: 3000,
  adminPin: "sila0022"
});
