"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";

const PRICING = [
  { access: "Hallway", sqft: ">1800", quality: "Good", estimate: 8000, range: "$8,000–$13,000" },
  { access: "Hallway", sqft: ">1800", quality: "Better", estimate: 12000, range: "$12,000–$15,000" },
  { access: "Hallway", sqft: ">1800", quality: "Best", estimate: 15000, range: "$15,000–$19,000" },
  { access: "Hallway", sqft: "<1800", quality: "Good", estimate: 6500, range: "$6,500–$11,500" },
  { access: "Hallway", sqft: "<1800", quality: "Better", estimate: 10500, range: "$10,500–$13,500" },
  { access: "Hallway", sqft: "<1800", quality: "Best", estimate: 13500, range: "$13,500–$17,500" },
  { access: "Attic", sqft: ">1800", quality: "Good", estimate: 9000, range: "$9,000–$14,000" },
  { access: "Attic", sqft: ">1800", quality: "Better", estimate: 13000, range: "$13,000–$16,000" },
  { access: "Attic", sqft: ">1800", quality: "Best", estimate: 16000, range: "$16,000–$20,000" },
  { access: "Attic", sqft: "<1800", quality: "Good", estimate: 7500, range: "$7,500–$12,500" },
  { access: "Attic", sqft: "<1800", quality: "Better", estimate: 11500, range: "$11,500–$14,500" },
  { access: "Attic", sqft: "<1800", quality: "Best", estimate: 14500, range: "$14,500–$18,500" },
];

function Card({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 cursor-pointer w-full
        ${
          selected
            ? "border-[#EC2225] bg-white shadow-lg scale-[1.02]"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
        }`}
    >
      <span className="text-4xl sm:text-5xl">{icon}</span>
      <span className="text-lg font-bold text-gray-900">{title}</span>
      {desc && <span className="text-sm text-gray-500 text-center">{desc}</span>}
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full flex gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all duration-500 ${
            i < current ? "bg-[#EC2225]" : i === current ? "bg-[#FCA5A5]" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [projectType, setProjectType] = useState("");
  const [unitType, setUnitType] = useState("");
  const [quality, setQuality] = useState("");
  const [access, setAccess] = useState("");
  const [sqft, setSqft] = useState("");

  // User info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Email status
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);

  const isGeothermal = unitType === "Geothermal";
  const isCommercial = projectType === "Commercial" && unitType === "Regular";
  const isResidentialRegular = projectType === "Residential" && unitType === "Regular";

  const result = useMemo(() => {
    if (isGeothermal && unitType && projectType) {
      return {
        type: "special" as const,
        message:
          "Thank you for your inquiry! Geothermal requests require a specialized quote. Our team will follow up with next steps.",
      };
    }
    if (isCommercial && projectType) {
      return {
        type: "special" as const,
        message:
          "Thank you for your inquiry! Commercial projects require a specialized quote. Our team will follow up with next steps.",
      };
    }
    if (isResidentialRegular && quality && access && sqft) {
      const row = PRICING.find((r) => r.access === access && r.sqft === sqft && r.quality === quality);
      if (row) {
        return {
          type: "estimate" as const,
          estimate: row.estimate,
          range: row.range,
          message: `Thank you for your inquiry! Your Total Cost Estimate is ${row.range}. Ask us about our rebates and financing options!`,
        };
      }
    }
    return null;
  }, [projectType, unitType, quality, access, sqft, isGeothermal, isCommercial, isResidentialRegular]);

  const steps = useMemo(() => {
    const s = ["projectType", "unitType"];
    if (isGeothermal || isCommercial) {
      s.push("userInfo", "results");
    } else {
      s.push("quality", "access", "sqft", "userInfo", "results");
    }
    return s;
  }, [isGeothermal, isCommercial]);

  const currentStepName = steps[step] || "projectType";

  const goTo = useCallback((nextStep: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 150);
  }, []);

  const goBack = () => {
    if (step > 0) goTo(step - 1);
  };

  const reset = () => {
    setProjectType("");
    setUnitType("");
    setQuality("");
    setAccess("");
    setSqft("");
    setName("");
    setEmail("");
    setPhone("");
    setEmailSent(false);
    setEmailError("");
    setSending(false);
    setStep(0);
    setAnimating(false);
  };

  const selectAndAdvance = (setter: (v: string) => void, value: string) => {
    setter(value);
    setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        setStep((prev) => prev + 1);
        setAnimating(false);
      }, 150);
    }, 200);
  };

  const sendQuoteEmail = useCallback(async () => {
    setSending(true);
    setEmailError("");
    try {
      const res = await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          projectType,
          unitType,
          quality,
          access,
          sqft,
          estimateRange: result?.type === "estimate" ? (result as { range: string }).range : undefined,
          message: result?.message,
        }),
      });
      if (res.ok) {
        setEmailSent(true);
        window.location.href = "https://dehartac.com/quote-thank-you/";
      } else {
        const data = await res.json();
        setEmailError(data.error || "Failed to send email");
      }
    } catch {
      setEmailError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  }, [name, email, phone, projectType, unitType, quality, access, sqft, result]);

  const handleUserInfoSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    setAnimating(true);
    setTimeout(() => {
      setStep((prev) => prev + 1);
      setAnimating(false);
      // Send email when moving to results
      setTimeout(() => sendQuoteEmail(), 300);
    }, 150);
  };

  const stepTitles: Record<string, string> = {
    projectType: "What type of project?",
    unitType: "What type of unit?",
    quality: "Choose your quality tier",
    access: "Where is your unit accessed?",
    sqft: "What is your square footage?",
    userInfo: "Your Contact Information",
    results: "Your Estimate",
  };

  const slideClass = animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-3">
            <Image src="/logo.png" alt="DeHart HVAC" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DeHart HVAC</h1>
          <p className="text-gray-500 mt-1">Get your instant cost estimate</p>
        </div>

        {/* Progress */}
        <ProgressBar current={step} total={steps.length} />

        {/* Wizard Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 min-h-[340px] flex flex-col">
          {/* Back button */}
          {step > 0 && currentStepName !== "results" && (
            <button
              onClick={goBack}
              className="self-start flex items-center gap-1 text-sm text-gray-500 hover:text-[#DC2626] transition mb-4 cursor-pointer"
            >
              <span>←</span> Back
            </button>
          )}

          {/* Step title */}
          <h2
            className={`text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6 transition-all duration-300 ${slideClass}`}
          >
            {stepTitles[currentStepName]}
          </h2>

          {/* Step content */}
          <div className={`flex-1 flex flex-col justify-center transition-all duration-300 ${slideClass}`}>
            {currentStepName === "projectType" && (
              <div className="grid grid-cols-2 gap-4">
                <Card
                  icon="🏠"
                  title="Residential"
                  selected={projectType === "Residential"}
                  onClick={() => selectAndAdvance(setProjectType, "Residential")}
                />
                <Card
                  icon="🏢"
                  title="Commercial"
                  selected={projectType === "Commercial"}
                  onClick={() => selectAndAdvance(setProjectType, "Commercial")}
                />
              </div>
            )}

            {currentStepName === "unitType" && (
              <div className="grid grid-cols-2 gap-4">
                <Card
                  icon="❄️"
                  title="Regular"
                  desc="Standard HVAC"
                  selected={unitType === "Regular"}
                  onClick={() => selectAndAdvance(setUnitType, "Regular")}
                />
                <Card
                  icon="🌍"
                  title="Geothermal"
                  desc="Earth-powered"
                  selected={unitType === "Geothermal"}
                  onClick={() => selectAndAdvance(setUnitType, "Geothermal")}
                />
              </div>
            )}

            {currentStepName === "quality" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                  icon="🥉"
                  title="Good"
                  desc="Reliable & affordable"
                  selected={quality === "Good"}
                  onClick={() => selectAndAdvance(setQuality, "Good")}
                />
                <Card
                  icon="🥈"
                  title="Better"
                  desc="Enhanced efficiency"
                  selected={quality === "Better"}
                  onClick={() => selectAndAdvance(setQuality, "Better")}
                />
                <Card
                  icon="🥇"
                  title="Best"
                  desc="Premium performance"
                  selected={quality === "Best"}
                  onClick={() => selectAndAdvance(setQuality, "Best")}
                />
              </div>
            )}

            {currentStepName === "access" && (
              <div className="grid grid-cols-2 gap-4">
                <Card
                  icon="🚪"
                  title="Hallway"
                  selected={access === "Hallway"}
                  onClick={() => selectAndAdvance(setAccess, "Hallway")}
                />
                <Card
                  icon="🪜"
                  title="Attic"
                  selected={access === "Attic"}
                  onClick={() => selectAndAdvance(setAccess, "Attic")}
                />
              </div>
            )}

            {currentStepName === "sqft" && (
              <div className="grid grid-cols-2 gap-4">
                <Card
                  icon="🏡"
                  title="< 1,800 sqft"
                  desc="Smaller home"
                  selected={sqft === "<1800"}
                  onClick={() => selectAndAdvance(setSqft, "<1800")}
                />
                <Card
                  icon="🏘️"
                  title="> 1,800 sqft"
                  desc="Larger home"
                  selected={sqft === ">1800"}
                  onClick={() => selectAndAdvance(setSqft, ">1800")}
                />
              </div>
            )}

            {currentStepName === "userInfo" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-[#EC2225] focus:outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-[#EC2225] focus:outline-none transition"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-[#EC2225] focus:outline-none transition"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <button
                  onClick={handleUserInfoSubmit}
                  disabled={!name.trim() || !email.trim()}
                  className="w-full mt-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get My Estimate →
                </button>
              </div>
            )}

            {currentStepName === "results" && result && (
              <div className="text-center space-y-4">
                {result.type === "estimate" ? (
                  <>
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-4xl mb-2">
                      ✅
                    </div>
                    <div className="text-4xl sm:text-5xl font-bold text-green-600">
                      {"range" in result ? result.range : ""}
                    </div>
                  </>
                ) : (
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-4xl mb-2">
                    📋
                  </div>
                )}
                <p
                  className={`text-base leading-relaxed ${
                    result.type === "estimate" ? "text-green-800" : "text-gray-700"
                  }`}
                >
                  {result.message}
                </p>

                {/* Email status */}
                {sending && (
                  <p className="text-sm text-gray-500 animate-pulse">Sending quote to your email...</p>
                )}
                {emailSent && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                    ✉️ Quote sent to your email!
                  </div>
                )}
                {emailError && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    ⚠️ {emailError}
                  </div>
                )}

                <button
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition shadow-md cursor-pointer"
                >
                  ↺ Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} DeHart HVAC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
