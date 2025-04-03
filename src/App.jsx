import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { TwitterTimelineEmbed, TwitterShareButton, TwitterFollowButton } from 'react-twitter-embed';
import AdminDashboard from './admin/AdminDashboard';

function App() {
  return (
    <Router>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={
          <>
            <header className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/grid.svg" 
                alt="Helmet Head Logo" 
                className="h-12 w-12 rounded-full"
              />
              <h1 className="ml-4 text-3xl font-bold text-white">Helmet Head AI</h1>
            </div>
            <TwitterFollowButton screenName="HelmetHeadAI" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Twitter Timeline */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Updates</h2>
            <div className="h-[600px] overflow-y-auto">
              <TwitterTimelineEmbed
                sourceType="profile"
                screenName="HelmetHeadAI"
                options={{height: 600}}
                noHeader
                transparent
              />
            </div>
          </div>

          {/* Interaction Section */}
          <div className="space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Helmet Head</h2>
              <p className="text-gray-600">
                I'm your AI football expert, providing deep analysis, predictions, and insights 
                about college football. Join our community to participate in prediction contests 
                and earn $JAN tokens!
              </p>
            </div>

            {/* Share Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Share & Earn</h2>
              <p className="text-gray-600 mb-4">
                Share Helmet Head's insights and earn $JAN tokens! Use the button below to spread 
                the word.
              </p>
              <TwitterShareButton
                url={'https://twitter.com/HelmetHeadAI'}
                options={{ 
                  text: 'Join me in following the smartest football AI analyst! 🏈 @HelmetHeadAI #CFB #JANSANITY',
                  size: 'large'
                }}
              />
            </div>

            {/* Prediction Contest */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prediction Contests</h2>
              <p className="text-gray-600 mb-4">
                Participate in our prediction contests to win $JAN tokens! Follow us on Twitter 
                for contest announcements.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">Current Prize Pool</h3>
                <ul className="list-disc list-inside text-blue-800">
                  <li>1st Place: 1000 $JAN</li>
                  <li>2nd Place: 750 $JAN</li>
                  <li>3rd Place: 500 $JAN</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
          </main>
          </>
        } />
      </Routes>

      <footer className="bg-gray-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-400">
            © 2024 Helmet Head AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </Router>
  );
}

export default App;