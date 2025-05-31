import { useState } from 'react'
import Header from './Header'

function Home() {
  const [resumeFile, setResumeFile] = useState(null);

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  return (
      <div className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
          <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-xl">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
              Welcome to Your Career Planner 🚀
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Let's define your goals and build your personalized career roadmap.
            </p>

            <form className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="career-goals">
                  Career Goals
                </label>
                <input
                  type="text"
                  id="career-goals"
                  placeholder="e.g., Become a Backend Engineer"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Resume
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <label className="cursor-pointer bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-xl hover:bg-blue-200 transition duration-200">
                    Choose File
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {resumeFile && (
                    <span className="text-sm text-gray-600 truncate max-w-xs">
                      {resumeFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="target-goal">
                  Target Goal
                </label>
                <input
                  type="text"
                  id="target-goal"
                  placeholder="e.g., Land a job at Google by Dec 2025"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 py-2 rounded-xl hover:bg-blue-700 transition duration-200"
              >
                Generate Roadmap
              </button>
            </form>
          </div>
        </div>
      </div>

  )
}

export default Home
