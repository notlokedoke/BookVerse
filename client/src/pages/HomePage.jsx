import React from 'react'

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome to BookVerse</h1>
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            Discover, trade, and share books with fellow readers in your community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">List Your Books</h3>
              <p className="text-gray-600">
                Create detailed listings of books you want to trade with photos and descriptions.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Find Books</h3>
              <p className="text-gray-600">
                Search for books by title, author, genre, or location to find your next great read.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Trade Safely</h3>
              <p className="text-gray-600">
                Connect with other readers, chat about trades, and build your reputation in the community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage