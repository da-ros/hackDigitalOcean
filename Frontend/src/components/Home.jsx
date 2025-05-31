import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // assuming react-router-dom v6+

export default function Home() {
  const [careerGoals, setCareerGoals] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!careerGoals || !targetGoal || !resumeFile) {
      alert("Please fill all fields and upload your resume.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("current_career", careerGoals);
    formData.append("future_goal", targetGoal);
    formData.append("resume", resumeFile);

    try {
      const res = await fetch("http://localhost:8000/generate-roadmap/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to fetch roadmap");

      const data = await res.json();
      // Redirect to dashboard with roadmap data as state
      navigate("/dashboard", { state: { roadmap: data.roadmap } });
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="career-goals"
              >
                Career Goals
              </label>
              <input
                type="text"
                id="career-goals"
                placeholder="e.g., Become a Backend Engineer"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
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
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="target-goal"
              >
                Target Goal
              </label>
              <input
                type="text"
                id="target-goal"
                placeholder="e.g., Land a job at Google by Dec 2025"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 py-2 rounded-xl hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Roadmap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
