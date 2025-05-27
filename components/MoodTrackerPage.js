// components/MoodTrackerPage.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import { formatDate as formatDateUtil, moodEmojis } from "../lib/formatters"; // Assuming formatters.js is in lib
import Loader from "./Loader";
import toast from "react-hot-toast";

export default function MoodTrackerPage({
  currentUser,
  getMoodChartDataAPI,
  getMoodEntriesAPI,
  moodDataVersion,
}) {
  const [stats, setStats] = useState({
    streak: 0,
    thisWeekDominant: "N/A",
    total: 0,
    avgMood: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state for the page
  const chartRef = useRef(null); // Ref for the canvas DOM element
  const chartInstanceRef = useRef(null); // Ref for the Chart.js instance
  const [selectedChartDays, setSelectedChartDays] = useState(7); // Default to 7 days

  // Memoized function to calculate stats and update recent entries
  const calculateAndSetStats = useCallback((entries) => {
    if (!entries || entries.length === 0) {
      setStats({ streak: 0, thisWeekDominant: "N/A", total: 0, avgMood: 0 });
      setRecentEntries([]);
      return;
    }

    const total = entries.length;
    const sumOfScores = entries.reduce((sum, entry) => sum + entry.score, 0);
    const avgMood = total > 0 ? (sumOfScores / total).toFixed(1) : 0;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
    );
    setRecentEntries(sortedEntries.slice(0, 3)); // Display top 3 recent

    let currentStreak = 0;
    if (sortedEntries.length > 0) {
      let todayForStreak = new Date();
      todayForStreak.setHours(0, 0, 0, 0);

      const firstEntryDate = new Date(sortedEntries[0].entryDate);
      firstEntryDate.setHours(0, 0, 0, 0);

      let expectedDate = new Date(todayForStreak);

      let streakStartDateCheck = new Date(todayForStreak);
      if (firstEntryDate.getTime() === streakStartDateCheck.getTime()) {
        currentStreak = 1;
        expectedDate.setDate(streakStartDateCheck.getDate() - 1);
      } else {
        streakStartDateCheck.setDate(streakStartDateCheck.getDate() - 1);
        if (firstEntryDate.getTime() === streakStartDateCheck.getTime()) {
          currentStreak = 1;
          expectedDate.setDate(streakStartDateCheck.getDate() - 1);
        }
      }

      if (currentStreak > 0) {
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDate = new Date(sortedEntries[i].entryDate);
          entryDate.setHours(0, 0, 0, 0);
          if (entryDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else if (entryDate.getTime() < expectedDate.getTime()) {
            break;
          }
        }
      }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const thisWeekEntries = entries.filter(
      (entry) => new Date(entry.entryDate) >= oneWeekAgo
    );
    let dominantMoodThisWeek = "N/A";
    if (thisWeekEntries.length > 0) {
      const moodCounts = thisWeekEntries.reduce((acc, entry) => {
        acc[entry.mood.toLowerCase()] =
          (acc[entry.mood.toLowerCase()] || 0) + 1;
        return acc;
      }, {});
      dominantMoodThisWeek = Object.keys(moodCounts).reduce((a, b) =>
        moodCounts[a] > moodCounts[b] ? a : b
      );
      dominantMoodThisWeek =
        dominantMoodThisWeek.charAt(0).toUpperCase() +
        dominantMoodThisWeek.slice(1);
    }
    setStats({
      streak: currentStreak,
      thisWeekDominant: dominantMoodThisWeek,
      total,
      avgMood,
    });
  }, []); // Empty dependency array: this function's definition is stable

  // Function to fetch chart-specific data and render/update the chart
  const renderOrUpdateChart = useCallback(
    async (days) => {
      if (!currentUser || !getMoodChartDataAPI || !chartRef.current) {
        console.log(
          "renderOrUpdateChart: Aborting - missing currentUser, API function, or canvas ref."
        );
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
        // setIsLoading(false); // Let calling effect handle this
        return;
      }

      // setIsLoading(true); // Set by calling effect

      try {
        const chartAPIData = await getMoodChartDataAPI(days);

        const labels = (chartAPIData || []).map((entry) =>
          formatDateUtil(entry.entryDate, true)
        );
        const dataPoints = (chartAPIData || []).map((entry) => entry.score);

        const chartConfigData = {
          labels:
            dataPoints.length > 0 ? labels : ["No Mood Data for this Period"],
          datasets: [
            {
              label: "Mood Score",
              data: dataPoints.length > 0 ? dataPoints : [],
              borderColor: "#667eea",
              backgroundColor: "rgba(102, 126, 234, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#667eea",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 6,
            },
          ],
        };

        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: dataPoints.length > 0 },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
              ticks: { color: "#64748b" },
              grid: { color: "#f1f5f9" },
            },
            x: { ticks: { color: "#64748b" }, grid: { display: false } },
          },
        };

        if (chartInstanceRef.current) {
          console.log(
            "renderOrUpdateChart: Updating existing chart instance with new data for days:",
            days
          );
          chartInstanceRef.current.data = chartConfigData; // Assign new data object
          // chartInstanceRef.current.options = chartOptions; // Only necessary if options change
          chartInstanceRef.current.update();
        } else if (chartRef.current) {
          console.log(
            "renderOrUpdateChart: Creating new chart instance for days:",
            days
          );
          chartInstanceRef.current = new Chart(
            chartRef.current.getContext("2d"),
            {
              type: "line",
              data: chartConfigData,
              options: chartOptions,
            }
          );
        }
      } catch (error) {
        console.error("Failed to render/update mood chart:", error);
        toast.error(
          `Error loading chart: ${error.data?.message || error.message}`
        );
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      }
      // setIsLoading(false); // Let calling effect handle this
    },
    [currentUser, getMoodChartDataAPI, formatDateUtil]
  ); // Dependencies of this callback

  // Main data fetching effect: runs on mount (if currentUser), or when user/moodDataVersion changes
  useEffect(() => {
    const loadPageData = async () => {
      if (!currentUser || !getMoodEntriesAPI) {
        calculateAndSetStats([]);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
        setIsLoading(false);
        return;
      }

      console.log(
        `MoodTrackerPage: Main useEffect - Loading all data. User: ${!!currentUser}, Version: ${moodDataVersion}, Days: ${selectedChartDays}`
      );
      setIsLoading(true);
      try {
        const allEntries = await getMoodEntriesAPI();
        calculateAndSetStats(allEntries || []);

        // Initial chart render with current selectedChartDays
        await renderOrUpdateChart(selectedChartDays);
      } catch (error) {
        console.error(
          "MoodTrackerPage: Error in main data fetching sequence (loadPageData)",
          error
        );
        toast.error(
          `Failed to load mood page data: ${
            error.data?.message || error.message
          }`
        );
        calculateAndSetStats([]);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
    // IMPORTANT: selectedChartDays is included here because the initial chart render needs it.
    // Changes to selectedChartDays *after* this initial load are handled by the next useEffect.
  }, [
    currentUser,
    moodDataVersion,
    getMoodEntriesAPI,
    calculateAndSetStats,
    renderOrUpdateChart,
    selectedChartDays,
  ]);

  // Effect to update chart ONLY when selectedChartDays changes AFTER the initial load handled by the above effect.
  const isInitialRenderForPeriodEffect = useRef(true); // To skip first run of this specific effect
  useEffect(() => {
    if (isInitialRenderForPeriodEffect.current) {
      isInitialRenderForPeriodEffect.current = false;
      // If selectedChartDays is ALREADY what the main useEffect used, don't re-fetch/re-render chart.
      // This check is a bit redundant now since the main useEffect depends on selectedChartDays for initial chart too.
      // The main purpose of this effect is to react to *subsequent* changes of selectedChartDays.
      return;
    }

    if (currentUser && chartRef.current) {
      console.log(
        "MoodTrackerPage: Period Change useEffect - Updating chart for days:",
        selectedChartDays
      );
      setIsLoading(true); // Show loader for chart update
      renderOrUpdateChart(selectedChartDays).finally(() => {
        setIsLoading(false);
      });
    }
    // renderOrUpdateChart is stable due to useCallback. This effect runs purely on selectedChartDays changing (and currentUser).
  }, [currentUser, selectedChartDays, renderOrUpdateChart]);

  // Cleanup chart instance on component unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      isInitialRenderForPeriodEffect.current = true; // Reset for next mount if any
    };
  }, []);

  const handlePeriodChange = (e) => {
    if (!isLoading) {
      // Prevent changing filter while data is loading
      setSelectedChartDays(parseInt(e.target.value));
    }
  };

  // Conditional rendering for loading/login prompt (before main return)
  if (!currentUser && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <i className="fas fa-chart-line text-4xl mb-4 text-purple-400"></i>
        <p>Please login to view your mood tracker.</p>
      </div>
    );
  }

  if (
    isLoading &&
    (!stats || stats.total === 0) &&
    recentEntries.length === 0
  ) {
    return (
      <Loader
        show={true}
        text="Loading your mood insights..."
        fullPage={false}
      />
    );
  }

  return (
    <div id="mood-tracker" className="page active">
      {" "}
      {/* 'active' class is handled by parent */}
      <div className="max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {" "}
          {/* Adjusted grid for better spacing */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.streak} days
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-fire text-green-600 text-lg"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.thisWeekDominant}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-smile text-blue-600 text-lg"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-calendar-alt text-purple-600 text-lg"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg. Mood</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgMood}/10
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-yellow-600 text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Mood Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-900">Mood Trends</h3>
            <select
              id="moodChartPeriodSelect"
              value={selectedChartDays}
              onChange={handlePeriodChange}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70 w-full sm:w-auto"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
            </select>
          </div>
          <div className="relative h-64 sm:h-72 md:h-80 lg:h-96">
            {" "}
            {/* Increased height slightly */}
            <canvas ref={chartRef} id="moodChartCanvasInternal"></canvas>
            {isLoading &&
              !chartInstanceRef.current && ( // Show loader overlay if loading and no chart yet
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-2xl">
                  <Loader
                    show={true}
                    text="Loading chart..."
                    fullPage={false}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Recent Mood Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Entries
          </h3>
          <div id="recentMoodEntriesList" className="space-y-4">
            {isLoading && recentEntries.length === 0 && (
              <Loader
                show={true}
                text="Loading recent entries..."
                fullPage={false}
              />
            )}
            {!isLoading && recentEntries.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No recent mood entries logged.
              </p>
            )}
            {recentEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">
                    {moodEmojis[entry.mood.toLowerCase()] || moodEmojis.default}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 capitalize">
                      {entry.mood}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateUtil(entry.entryDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-800">
                    {entry.score}/10
                  </p>
                  {entry.notes && (
                    <p
                      className="text-xs text-gray-500 truncate w-24 hover:whitespace-normal hover:overflow-visible"
                      title={entry.notes}
                    >
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
