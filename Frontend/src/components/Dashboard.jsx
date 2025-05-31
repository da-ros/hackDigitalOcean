import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // If no roadmap data, redirect to home
  if (!location.state?.roadmap) {
    navigate("/", { replace: true });
    return null;
  }

  const { roadmap } = location.state;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <h2 className="text-2xl font-bold mb-6">Your Career Roadmap</h2>
      <pre className="whitespace-pre-wrap bg-white p-6 rounded-lg shadow-md">
        {roadmap}
      </pre>
    </div>
  );
};

export default Dashboard; 