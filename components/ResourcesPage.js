// components/ResourcesPage.js
"use client";
import toast from "react-hot-toast";

// Props: openBreathingExercise (function)
export default function ResourcesPage({ openBreathingExercise }) {
  const copingTools = [
    {
      title: "Breathing Exercises",
      icon: "fa-wind",
      color: "blue",
      description:
        "Guided breathing techniques to help you relax and center yourself.",
      action: openBreathingExercise,
    },
    {
      title: "Meditation Guide",
      icon: "fa-meditation",
      color: "purple",
      description:
        "Simple meditation practices for mindfulness and stress relief.",
      action: () => toast("Meditation Guide coming soon!"),
    },
    {
      title: "Gratitude Practice",
      icon: "fa-heart",
      color: "green",
      description:
        "Daily gratitude exercises to shift perspective and boost mood.",
      action: () => toast("Gratitude Practice coming soon!"),
    },
    {
      title: "Progressive Relaxation",
      icon: "fa-spa",
      color: "yellow",
      description: "Step-by-step muscle relaxation techniques.",
      action: () => toast("Progressive Relaxation coming soon!"),
    },
    {
      title: "Grounding Techniques",
      icon: "fa-anchor",
      color: "indigo",
      description: "Methods to stay present and manage overwhelming feelings.",
      action: () => toast("Grounding Techniques coming soon!"),
    },
    {
      title: "Self-Care Ideas",
      icon: "fa-sparkles",
      color: "pink",
      description:
        "Simple and effective self-care activities for daily wellness.",
      action: () => toast("Self-Care Ideas coming soon!"),
    },
  ];

  const professionalSupportLinks = {
    "Find a Therapist": [
      { name: "Psychology Today", url: "#" },
      { name: "BetterHelp", url: "#" },
      { name: "Talkspace", url: "#" },
    ],
    "Support Groups": [
      { name: "NAMI Support Groups", url: "#" },
      { name: "Mental Health America", url: "#" },
      { name: "Local Community Centers", url: "#" },
    ],
  };

  const learnMoreItems = [
    {
      title: "Understanding Mental Health",
      icon: "fa-brain",
      color: "blue",
      description:
        "Learn about common mental health conditions and their symptoms.",
    },
    {
      title: "Recommended Reading",
      icon: "fa-book",
      color: "green",
      description:
        "Books and articles about mental wellness and personal growth.",
    },
    {
      title: "Podcasts & Videos",
      icon: "fa-podcast",
      color: "purple",
      description: "Audio and video content from mental health experts.",
    },
  ];

  return (
    <div id="resources" className="page active">
      <div className="max-w-6xl mx-auto">
        {/* Emergency Resources */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                In Crisis? Get Help Now
              </h3>
              <p className="text-red-700 text-sm">
                If you&apos;re having thoughts of self-harm, please reach out
                immediately
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-medium text-gray-900">
                National Suicide Prevention Lifeline
              </p>
              <p className="text-lg font-bold text-red-600">988</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-medium text-gray-900">Crisis Text Line</p>
              <p className="text-lg font-bold text-red-600">
                Text HOME to 741741
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-medium text-gray-900">Emergency Services</p>
              <p className="text-lg font-bold text-red-600">911</p>
            </div>
          </div>
        </div>

        {/* Coping Tools */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {copingTools.map((tool) => (
            <div
              key={tool.title}
              onClick={tool.action}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div
                className={`w-12 h-12 bg-${tool.color}-100 rounded-xl flex items-center justify-center mb-4`}
              >
                <i className={`fas ${tool.icon} text-${tool.color}-600`}></i>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{tool.title}</h4>
              <p className="text-gray-600 text-sm">{tool.description}</p>
            </div>
          ))}
        </div>

        {/* Professional Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Professional Support
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(professionalSupportLinks).map(([title, links]) => (
              <div
                key={title}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
                <p className="text-gray-600 text-sm mb-3">
                  {title === "Find a Therapist"
                    ? "Connect with licensed mental health professionals..."
                    : "Join communities of people with shared experiences"}
                </p>
                <div className="space-y-2">
                  {links.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Educational Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Learn More
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {learnMoreItems.map((item) => (
              <div key={item.title} className="text-center">
                <div
                  className={`w-16 h-16 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <i
                    className={`fas ${item.icon} text-${item.color}-600 text-xl`}
                  ></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
